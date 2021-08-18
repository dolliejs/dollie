import {
  Origin,
} from '@dollie/origins';
import {
  BinaryTable,
  CacheTable,
  FileSystem,
  MergeTable,
  MessageHandler,
  TemplateConfig,
  GeneratorConfig,
  Question,
  ExtendTemplateConfig,
} from '../interfaces';
import {
  ContextError,
  DollieError,
} from '../errors';
import * as _ from 'lodash';
import { createHttpInstance } from '../http';
import fs from 'fs';
import decompress from 'decompress';
import { loadRemoteTemplate } from '../loader';
import {
  EXTEND_TEMPLATE_PREFIX,
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_CONFIG_FILE_NAMES,
} from '../constants';
import path from 'path';
import requireFromString from 'require-from-string';
import { Volume } from 'memfs';

abstract class Generator {
  // name of template that to be used
  public templateName: string;
  // selected origin id
  public templateOrigin: string;
  // virtual file system instance
  protected volume: FileSystem;
  // template config, read from `dollie.js` or `dollie.json`
  protected templateConfig: TemplateConfig = {};
  // the table who stores all files
  // key is relative pathname, value is the diff changes
  protected cacheTable: CacheTable = {};
  protected mergeTable: MergeTable = {};
  // store binary pathname in virtual file system
  protected binaryTable: BinaryTable = {};
  // origins list
  protected origins: Origin[] = [];
  protected messageHandler: MessageHandler;

  public constructor(
    protected projectName: string,
    protected templateOriginName: string,
    protected config: GeneratorConfig = {},
  ) {
    this.templateName = '';
    this.templateOrigin = '';
    this.volume = new Volume();
    const { onMessage: messageHandler = _.noop } = this.config;
    this.messageHandler = messageHandler;
  }

  public async loadTemplate() {
    this.messageHandler(`Start downloading template from ${this.templateOrigin}:${this.templateName}`);

    const {
      originHandler,
    } = this.config;

    const handler = originHandler;

    if (!_.isFunction(handler)) {
      throw new ContextError(`origin \`${this.templateOrigin}\` has a wrong handler type`);
    }

    // get url and headers from origin handler
    const { url, headers } = await handler(
      this.templateName,
      _.get(this.config, 'origin') || {},
      createHttpInstance(_.get(this.config, 'loader') || {}),
      {
        fs,
        lodash: _,
      },
    );

    if (!_.isString(url) || !url) {
      throw new ContextError(`origin \`${this.templateOrigin}\` url parsed with errors`);
    }

    this.messageHandler(`Template URL parsed: ${url}`);

    const startTimestamp = Date.now();

    let data: Buffer;

    const {
      getCache,
      setCache = _.noop,
    } = this.config;

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

    if (!data || !_.isBuffer(data)) {
      throw new DollieError('No template file found, exiting...');
    }

    setCache(url, data);

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
  }

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

  public abstract checkInputs(): void;
  public abstract initialize(): void;
  public abstract checkContext(): void;
  public abstract queryAllTemplateProps(): void;
  public abstract copyTemplateFileToCacheTable(): void;
  public abstract deleteFiles(): void;
  public abstract mergeTemplateFiles(): void;
  public abstract resolveConflicts(): void;
  public abstract runCleanups(): void;
  public abstract getResult(): void;
}

export default Generator;
