import {
  CacheTable,
  DollieConfig,
  DollieTemplateConfig,
  FileSystem,
  TemplateEntity,
  TemplatePropsItem,
} from './interfaces';
import _ from 'lodash';
import {
  InvalidInputError,
  ContextError,
} from './errors';
import {
  DollieOrigin,
  githubOrigin,
  gitlabOrigin,
} from '@dollie/origins';
import { Volume } from 'memfs';
import { loadTemplate, readTemplateEntities } from './loader';
import path from 'path';
import {
  EXTEND_TEMPLATE_LABEL_PREFIX,
  EXTEND_TEMPLATE_PATHNAME_PREFIX,
  MAIN_TEMPLATE_PATHNAME_PREFIX,
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_FILE_PREFIX,
} from './constants';
import requireFromString from 'require-from-string';
import { answersParser } from './props';
import { diff } from './diff';
import ejs from 'ejs';

class Generator {
  public templateName: string;
  public templateOrigin: string;
  protected origins: DollieOrigin[];
  protected volume: FileSystem;
  protected templateConfig: DollieTemplateConfig;
  protected cacheTable: CacheTable = {};
  protected binaryEntities: TemplateEntity[];
  private moduleProps: TemplatePropsItem[];
  private pendingModuleLabels: string[];

  public constructor(
    private templateOriginName: string,
    private config: DollieConfig = {},
    protected projectName: string,
  ) {
    this.templateName = '';
    this.templateOrigin = '';
    this.origins = [githubOrigin, gitlabOrigin];
    this.volume = new Volume();
    this.pendingModuleLabels.push('main');
  }

  public checkInputs() {
    if (!this.templateOriginName || !_.isString(this.templateOriginName)) {
      throw new InvalidInputError('name should be a string');
    }
    if (!this.projectName || !_.isString(this.projectName)) {
      throw new InvalidInputError('projectName should be a string');
    }
  }

  public async initialize() {
    const { origins: customOrigins = [] } = this.config;
    this.origins = this.origins.concat(customOrigins);
    if (_.isString(this.templateOriginName)) {
      [this.templateName, this.templateOrigin = 'github'] = this.templateOriginName.split(':');
    }
    this.templateConfig = this.getTemplateConfig();
  }

  public checkContext() {
    const originIds = this.origins.map((origin) => origin.name);
    const uniqueOriginIds = _.uniq(originIds);
    if (originIds.length > uniqueOriginIds.length) {
      throw new ContextError('duplicated origin names');
    }
  }

  public async loadTemplate() {
    const origin = this.origins.find((origin) => origin.name === this.templateOrigin);

    if (!origin) {
      throw new ContextError(`origin name \`${this.templateOrigin}\` not found`);
    }

    if (!_.isFunction(origin.handler)) {
      throw new ContextError(`origin \`${this.templateOrigin}\` has a wrong handler type`);
    }

    const { url, headers } = await origin.handler(
      this.templateName,
      _.get(this.config, `origins.${this.templateOrigin}`),
    );

    if (!_.isString(url) || !url) {
      throw new ContextError(`origin \`${this.templateOrigin}\` url parsed with errors`);
    }

    return await loadTemplate(url, this.volume, {
      headers,
      ...({
        timeout: 90000,
      }),
      ...this.config.loader,
    });
  }

  public async queryAllTemplateProps() {
    while (this.pendingModuleLabels.length !== 0) {
      const currentPendingModuleLabel = this.pendingModuleLabels.shift();
      if (currentPendingModuleLabel === 'main') {
        await this.getTemplateProps();
      } else if (currentPendingModuleLabel.startsWith(EXTEND_TEMPLATE_LABEL_PREFIX)) {
        await this.getTemplateProps(currentPendingModuleLabel);
      }
    }
    return this.moduleProps;
  }

  public async generateTemplateFile(propItems: TemplatePropsItem[]) {
    for (const propItem of propItems) {
      const { label, props } = propItem;
      let moduleStartPathname: string;
      if (label === 'main') {
        moduleStartPathname = `${TEMPLATE_CACHE_PATHNAME_PREFIX}${MAIN_TEMPLATE_PATHNAME_PREFIX}`;
      } else if (label.startsWith(EXTEND_TEMPLATE_PATHNAME_PREFIX)) {
        const extendTemplateId = label.slice(EXTEND_TEMPLATE_LABEL_PREFIX.length);
        moduleStartPathname = `${TEMPLATE_CACHE_PATHNAME_PREFIX}${EXTEND_TEMPLATE_PATHNAME_PREFIX}/${extendTemplateId}`;
      }
      if (moduleStartPathname) {
        const entities = readTemplateEntities(this.volume, moduleStartPathname);
        for (const entity of entities) {
          const {
            absolutePathname,
            entityName,
            isBinary,
            isDirectory,
            relativeDirectoryPathname,
          } = entity;
          if (isDirectory) { continue; }
          if (isBinary) {
            this.binaryEntities.push(entity);
          } else {
            const fileRawContent = this.volume.readFileSync(absolutePathname).toString();
            let fileContent: string;

            if (entityName.startsWith(TEMPLATE_FILE_PREFIX)) {
              fileContent = ejs.render(fileRawContent, props);
            } else {
              fileContent = fileRawContent;
            }

            const currentFileName = entityName.startsWith(TEMPLATE_FILE_PREFIX)
              ? entityName.slice(TEMPLATE_FILE_PREFIX.length)
              : entityName;
            const currentFileRelativePathname = `${relativeDirectoryPathname}/${currentFileName}`;

            const currentFileDiffChanges = diff(fileContent);
            if (
              !this.cacheTable[currentFileRelativePathname]
              || !_.isArray(this.cacheTable[currentFileRelativePathname])
            ) {
              this.cacheTable[currentFileRelativePathname] = [];
            }
            const currentCacheTableItem = this.cacheTable[currentFileRelativePathname];
            currentCacheTableItem.push(currentFileDiffChanges);
          }
        }
      }
    }
  }

  private async getTemplateProps(extendTemplateLabel = null) {
    const { getTemplateProps } = this.config;
    const questions = (extendTemplateLabel && _.isString(extendTemplateLabel))
      ? _.get(this.templateConfig, 'questions.main')
      : _.get(this.templateConfig, `question.extendedTemplates.${extendTemplateLabel}`);

    if (_.isFunction(getTemplateProps) && (questions && _.isArray(questions) && questions.length > 0)) {
      const answers = await getTemplateProps(this.templateConfig.questions.main);
      const { props = {}, pendingExtendTemplateLabels = [] } = answersParser(answers);

      this.moduleProps.push({
        props,
        label: extendTemplateLabel ? extendTemplateLabel : 'main',
      });

      if (pendingExtendTemplateLabels.length > 0) {
        for (const pendingExtendTemplateLabel of pendingExtendTemplateLabels) {
          this.pendingModuleLabels.push(`${EXTEND_TEMPLATE_LABEL_PREFIX}${pendingExtendTemplateLabel}`);
        }
      }
    }
  }

  private readTemplateFileBuffer(pathname: string): Buffer {
    return this.volume.readFileSync(path.resolve(
      TEMPLATE_CACHE_PATHNAME_PREFIX,
      pathname,
    )) as Buffer;
  }

  private readTemplateFileContent(pathname: string): string {
    return this.readTemplateFileBuffer(pathname).toString();
  }

  private checkFile(pathname: string): boolean {
    const absolutePathname = path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, pathname);
    return (
      this.volume.existsSync(absolutePathname)
      && this.volume.statSync(absolutePathname).isFile()
    );
  }

  private getTemplateConfig() {
    let configFileName: string;
    if (this.checkFile('.dollie.json')) {
      configFileName = '.dollie.json';
    } else if (this.checkFile('.dollie.js')) {
      configFileName = '.dollie.js';
    }
    if (!configFileName) {
      return {} as DollieTemplateConfig;
    }

    const dollieConfigFileContent = this.readTemplateFileBuffer(configFileName).toString();

    if (configFileName.endsWith('.json')) {
      try {
        return JSON.parse(dollieConfigFileContent) as DollieTemplateConfig;
      } catch {
        return {} as DollieTemplateConfig;
      }
    } else if (configFileName.endsWith('.js')) {
      return (requireFromString(dollieConfigFileContent) || {}) as DollieTemplateConfig;
    } else {
      return {} as DollieTemplateConfig;
    }
  }
}

export default Generator;
