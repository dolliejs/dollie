import {
  OriginHandler,
} from '@dollie/origins';
import {
  BinaryTable,
  MergeTable,
  MessageHandler,
  TemplateConfig,
  Question,
  ExtendTemplateConfig,
  GeneratorResult,
  BaseGeneratorConfig,
  ErrorHandler,
  CacheTable,
} from './interfaces';
import * as _ from 'lodash';
import {
  Got,
} from 'got';
import { createHttpInstance } from './utils/http';
import decompress from 'decompress';
import { loadRemoteTemplate } from './utils/loader';
import {
  EXTEND_TEMPLATE_PREFIX,
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_CONFIG_FILE_NAMES,
} from './constants';
import path from 'path';
import requireFromString from 'require-from-string';
import { Volume } from 'memfs';
import {
  ParameterInvalidError,
  OriginHandlerNotSpecifiedError,
  OriginHandlerError,
  TemplateFileNotFound,
  IllegalTemplateConfigError,
} from './errors';
import {
  FileSystem,
  validate,
} from '@dollie/utils';
import { GlobMatcher } from './utils/matchers';
import {
  merge,
  parseDiffToMergeBlocks,
} from './diff';

abstract class Generator {
  // name of template that to be used
  public templateName: string;
  // selected origin id
  // virtual file system instance
  protected volume: FileSystem;
  // template config, read from `dollie.js` or `dollie.json`
  protected templateConfig: TemplateConfig = {};
  protected mergeTable: MergeTable = {};
  // the table who stores all files
  // key is relative pathname, value is the diff changes
  protected cacheTable: CacheTable = {};
  // store binary pathname in virtual file system
  protected binaryTable: BinaryTable = {};
  // origins list
  // protected origins: Origin[] = [];
  protected messageHandler: MessageHandler;
  protected errorHandler: ErrorHandler;
  protected originHandler: OriginHandler;
  // glob pathname matcher
  protected matcher: GlobMatcher;
  protected request: Got;

  public constructor(
    protected genericId: string,
    protected config: BaseGeneratorConfig = {},
  ) {
    this.templateName = '';
    this.volume = new Volume();
    const {
      originHandler,
      onMessage: messageHandler = _.noop,
      onError: errorHandler = _.noop,
    } = this.config;
    this.errorHandler = errorHandler;
    this.messageHandler = messageHandler;
    this.originHandler = originHandler;
    this.request = createHttpInstance(_.get(this.config, 'loader') || {});
  }

  public checkInputs() {
    this.messageHandler('Validating inputs...');

    if (!this.genericId || !_.isString(this.genericId)) {
      this.errorHandler(new ParameterInvalidError('name'));
    }

    if (!_.isObjectLike(this.config)) {
      this.errorHandler(new ParameterInvalidError('config'));
    }
  };

  public async checkContext() {
    this.messageHandler('Checking runtime context...');

    if (!_.isFunction(this.originHandler)) {
      this.errorHandler(new OriginHandlerNotSpecifiedError());
    }
  }

  public async loadTemplate() {
    this.messageHandler(`Start downloading template ${this.templateName}`);

    try {
      // get url and headers from origin handler
      const {
        url,
        headers,
        cache = true,
        buffer,
      } = await this.originHandler(
        this.templateName,
        _.get(this.config, 'origin') || {},
        {
          lodash: _,
          request: this.request,
        },
      );

      if (!_.isString(url) || !url || !buffer || !_.isBuffer(buffer)) {
        this.errorHandler(new OriginHandlerError());
      }

      this.messageHandler(`Template URL parsed: ${url}`);

      const startTimestamp = Date.now();

      let data: Buffer;

      const {
        getCache,
        setCache = _.noop,
      } = this.config;

      if (buffer && _.isBuffer(buffer)) {
        data = buffer;
      } else {
        if (_.isFunction(getCache)) {
          data = await getCache(url);
        }

        if (_.isBuffer(data)) {
          this.messageHandler('Hit cache for current template');
        } else {
          data = await loadRemoteTemplate(url, {
            headers,
            ...({
              timeout: 90000,
            }),
            ...this.config.loader,
          });
        }
      }

      if (!data || !_.isBuffer(data)) {
        this.errorHandler(new TemplateFileNotFound());
      }

      if (cache) {
        setCache(url, data);
      }

      const endTimestamp = Date.now();

      await new Promise<void>((resolve) => {
        decompress(data).then((files) => {
          for (const file of files) {
            const { type, path: filePath, data } = file;
            if (type === 'directory') {
              this.volume.mkdirSync(this.getAbsolutePath(filePath), {
                recursive: true,
              });
            } else if (type === 'file') {
              this.volume.writeFileSync(this.getAbsolutePath(filePath), data, {
                encoding: 'utf8',
              });
            }
          }

          resolve();
        });
      });

      const duration = endTimestamp - startTimestamp;

      this.messageHandler(`Template downloaded in ${duration}ms`);
      this.messageHandler('Parsing template config...');

      this.templateConfig = this.parseTemplateConfig();

      this.messageHandler('Template config parsed successfully');

      return duration;
    } catch (e) {
      this.errorHandler(e);
    }
  }

  public mergeTemplateFiles(removeLine = true) {
    for (const entityPathname of Object.keys(this.cacheTable)) {
      const diffs = this.cacheTable[entityPathname];
      if (!diffs || !_.isArray(diffs) || diffs.length === 0) {
        continue;
      }
      if (this.matcher.match(entityPathname, 'merge')) {
        if (diffs.length === 1) {
          this.mergeTable[entityPathname] = parseDiffToMergeBlocks(diffs[0]);
        } else {
          const originalDiffChanges = diffs[0];
          const forwardDiffChangesGroup = diffs.slice(1);
          // merge diff changes if current file is written more than once
          const mergedDiffChanges = merge(originalDiffChanges, forwardDiffChangesGroup, removeLine);
          this.mergeTable[entityPathname] = parseDiffToMergeBlocks(mergedDiffChanges);
        }
      } else {
        // if current file does not match patterns in `merge`
        // then get the content from the last diff changes
        this.mergeTable[entityPathname] = parseDiffToMergeBlocks(_.last(diffs));
      }
    }
  }

  public deleteFiles() {
    this.cacheTable = this.handleDeleteFiles<CacheTable>(this.cacheTable, 'delete');
    this.binaryTable = this.handleDeleteFiles<BinaryTable>(this.binaryTable, 'delete');
  }

  protected handleDeleteFiles = <T extends Object>(table: T, type: string) => {
    return Object.keys(table).reduce((result, currentPathname) => {
      if (!this.matcher.match(currentPathname, type)) {
        result[currentPathname] = table[currentPathname];
      }
      return result;
    }, {} as T);
  };

  private parseTemplateConfig() {
    const postfixes: string[] = [];

    const generatePostfix = () => {
      const postfix = Math.random().toString(32).slice(2);
      if (postfixes.includes(postfix)) {
        return generatePostfix();
      } else {
        return postfix;
      }
    };

    const modifyQuestionName = (questions: Question[] = []) => {
      return questions.map((question) => {
        const { name } = question;
        if (name.startsWith(`${EXTEND_TEMPLATE_PREFIX}`) && name.endsWith('$')) {
          return {
            ...question,
            name: `${name}__${generatePostfix()}`,
          };
        }
        return question;
      });
    };

    const config = this.getTemplateConfig();

    const extendTemplates = (_.get(config, 'extendTemplates') || {}) as ExtendTemplateConfig;

    return {
      ...config,
      questions: modifyQuestionName(_.get(config, 'questions') || []),
      extendTemplates: Object.keys(extendTemplates).reduce((result, templateId) => {
        const currentExtendTemplateConfig = extendTemplates[templateId];
        result[templateId] = {
          ...currentExtendTemplateConfig,
          questions: modifyQuestionName(_.get(currentExtendTemplateConfig, 'questions')),
        } as Omit<TemplateConfig, 'extendTemplates'>;
        return result;
      }, {} as ExtendTemplateConfig),
    } as TemplateConfig;
  }

  private getAbsolutePath(pathname: string) {
    const relativePathname = pathname.split('/').slice(1).join('/');
    return path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, relativePathname);
  }

  private getTemplateConfig() {
    let configFileName: string;

    for (const fileName of TEMPLATE_CONFIG_FILE_NAMES) {
      if (this.checkFile(fileName)) {
        configFileName = fileName;
        break;
      }
    }

    if (!configFileName) {
      return {} as TemplateConfig;
    }

    const dollieConfigFileContent = this.readTemplateFileBuffer(configFileName).toString();

    if (configFileName.endsWith('.json')) {
      try {
        return JSON.parse(dollieConfigFileContent) as TemplateConfig;
      } catch {
        return {} as TemplateConfig;
      }
    } else if (configFileName.endsWith('.js')) {
      this.validateTemplateJSConfig(dollieConfigFileContent);
      return (requireFromString(dollieConfigFileContent) || {}) as TemplateConfig;
    } else {
      return {} as TemplateConfig;
    }
  }

  private checkFile(pathname: string): boolean {
    const absolutePathname = path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, pathname);
    return (
      this.volume.existsSync(absolutePathname) &&
      this.volume.statSync(absolutePathname).isFile()
    );
  }

  private readTemplateFileBuffer(pathname: string): Buffer {
    return this.volume.readFileSync(path.resolve(
      TEMPLATE_CACHE_PATHNAME_PREFIX,
      pathname,
    )) as Buffer;
  }

  private validateTemplateJSConfig(source: string) {
    if (!validate(source)) {
      this.errorHandler(new IllegalTemplateConfigError());
    }
  }

  public abstract initialize(): void;
  public abstract queryAllTemplateProps(): void;
  public abstract copyTemplateFileToCacheTable(): void;
  public abstract resolveConflicts(): void;
  public abstract runCleanups(): void;
  public abstract getResult(): GeneratorResult;
}

export default Generator;
