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
  TemplateCleanUpFunction,
  ClonedTables,
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
  TemplateFileNotFoundError,
  IllegalTemplateConfigError,
  TemplateEntryIllegalError,
} from './errors';
import {
  FileSystem,
  validate,
} from '@dollie/utils';
import { GlobMatcher } from './utils/matchers';
import {
  merge,
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
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
  protected cleanups: TemplateCleanUpFunction[];
  private templateConfigFilename: string;

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
      // get url and headers or a buffer from origin handler
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

      if ((!_.isString(url) || !url) && (!buffer || !_.isBuffer(buffer))) {
        this.errorHandler(new OriginHandlerError());
      }

      if (url && _.isString(url)) {
        this.messageHandler(`Template URL parsed: ${url}`);
      } else if (buffer && _.isBuffer(buffer)) {
        this.messageHandler('Template package buffer received');
      }

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
        this.errorHandler(new TemplateFileNotFoundError());
      }

      if (cache) {
        setCache(url, data);
      }

      const endTimestamp = Date.now();

      const templatePackageFiles = await decompress(data);

      const templateConfigFiles: Array<decompress.File & { priority: number }> = templatePackageFiles.map((file) => {
        const { path: filePath } = file;
        const filename = path.basename(filePath);

        return {
          ...file,
          priority: TEMPLATE_CONFIG_FILE_NAMES.indexOf(filename),
        };
      })
        .filter((file) => file.priority !== -1)
        .sort((previousFile, nextFile) => previousFile.priority - nextFile.priority);

      if (templateConfigFiles.length === 0) {
        this.errorHandler(new TemplateEntryIllegalError());
      }

      const { path: templateConfigFilePathname } = templateConfigFiles[0];
      const templatePackageBasePathname = path.dirname(templateConfigFilePathname);
      this.templateConfigFilename = path.basename(templateConfigFilePathname);

      for (const file of templatePackageFiles) {
        const { type, path: filePath, data } = file;

        const currentAbsolutePathname = this.getAbsolutePath(templatePackageBasePathname, filePath);

        if (currentAbsolutePathname === TEMPLATE_CACHE_PATHNAME_PREFIX) {
          continue;
        }

        if (type === 'directory') {
          this.volume.mkdirSync(currentAbsolutePathname, {
            recursive: true,
          });
        } else if (type === 'file') {
          this.volume.writeFileSync(currentAbsolutePathname, data, {
            encoding: 'utf8',
          });
        }
      }

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

  public async runCleanups() {
    this.messageHandler('Running cleanup functions...');

    this.cleanups = this.getCleanupFunctions();

    const clonedTables = this.getClonedTables();

    const addFile = (pathname: string, content: string) => {
      if (!clonedTables.mergeTable[pathname]) {
        clonedTables.mergeTable[pathname] = parseFileTextToMergeBlocks(content);
      }
    };

    const addTextFile = addFile;

    const addBinaryFile = (pathname: string, content: Buffer) => {
      if (!clonedTables.binaryTable[pathname]) {
        clonedTables.binaryTable[pathname] = content;
      }
    };

    const deleteFiles = (patternsList: string[]) => {
      const matcher = new GlobMatcher({
        current: patternsList,
      });

      clonedTables.mergeTable = Object.keys(clonedTables.mergeTable).reduce((result, currentPathname) => {
        if (!matcher.match(currentPathname, 'current')) {
          result[currentPathname] = clonedTables.mergeTable[currentPathname];
        }
        return result;
      }, {} as MergeTable);

      clonedTables.binaryTable = Object.keys(clonedTables.binaryTable).reduce((result, currentPathname) => {
        if (!matcher.match(currentPathname, 'current')) {
          result[currentPathname] = clonedTables.binaryTable[currentPathname];
        }
        return result;
      }, {} as BinaryTable);
    };

    const exists = (pathname: string): boolean => {
      return Boolean(clonedTables.projectMergeTable[pathname]);
    };

    const getTextFileContent = (pathname: string) => {
      return parseMergeBlocksToText(this.mergeTable[pathname]);
    };

    const getBinaryFileBuffer = (pathname: string) => {
      return this.binaryTable[pathname];
    };

    for (const cleanup of this.cleanups) {
      await cleanup({
        addFile,
        addTextFile,
        addBinaryFile,
        deleteFiles,
        exists,
        getTextFileContent,
        getBinaryFileBuffer,
      });
    }

    Object.keys(clonedTables).forEach((tableName) => {
      this[tableName] = Object.keys(clonedTables[tableName]).reduce((result, pathname) => {
        const content = clonedTables[tableName][pathname];
        if (!_.isNull(content)) {
          result[pathname] = content;
        }
        return result;
      }, {});
    });
  }

  protected handleDeleteFiles = <T extends Object>(table: T, type: string) => {
    return Object.keys(table).reduce((result, currentPathname) => {
      if (!this.matcher.match(currentPathname, type)) {
        result[currentPathname] = table[currentPathname];
      }
      return result;
    }, {} as T);
  };

  protected getClonedTables(): ClonedTables {
    return {
      mergeTable: _.clone(this.mergeTable),
      cacheTable: _.clone(this.cacheTable),
      binaryTable: _.clone(this.binaryTable),
      projectMergeTable: _.clone(this.mergeTable),
    };
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

  private getAbsolutePath(basePathname: string, pathname: string) {
    const relativePathname = path.relative(basePathname, pathname);
    return path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, relativePathname);
  }

  private getTemplateConfig() {
    const configFilename = this.templateConfigFilename;

    this.messageHandler(`Read template config from ${configFilename}`);
    const dollieConfigFileContent = this.readTemplateFileBuffer(configFilename).toString();

    if (configFilename.endsWith('.json')) {
      try {
        return JSON.parse(dollieConfigFileContent) as TemplateConfig;
      } catch {
        return {} as TemplateConfig;
      }
    } else if (configFilename.endsWith('.js')) {
      this.validateTemplateJSConfig(dollieConfigFileContent);
      return (requireFromString(dollieConfigFileContent) || {}) as TemplateConfig;
    } else {
      return {} as TemplateConfig;
    }
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
  public abstract getResult(): GeneratorResult;
  protected abstract getCleanupFunctions(): TemplateCleanUpFunction[];
}

export default Generator;
