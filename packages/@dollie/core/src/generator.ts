import {
  DollieConfig,
  DollieTemplateConfig,
  FileSystem,
  TemplatePropsQueueItem,
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
import { loadTemplate } from './loader';
import path from 'path';
import { VIRTUAL_VOLUME_DESTINATION_PATHNAME } from './constants';
import requireFromString from 'require-from-string';
import { answersParser } from './props';

class Generator {
  public templateName: string;
  public templateOrigin: string;
  protected origins: DollieOrigin[];
  protected volume: FileSystem;
  protected templateConfig: DollieTemplateConfig;
  private moduleProps: TemplatePropsQueueItem[];
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
      } else if (currentPendingModuleLabel.startsWith('extend:')) {
        await this.getTemplateProps(currentPendingModuleLabel);
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
          this.pendingModuleLabels.push(`extend:${pendingExtendTemplateLabel}`);
        }
      }
    }
  }

  private readTemplateFile(pathname: string): Buffer {
    return this.volume.readFileSync(path.resolve(
      VIRTUAL_VOLUME_DESTINATION_PATHNAME,
      pathname,
    )) as Buffer;
  }

  private checkFile(pathname: string): boolean {
    const absolutePathname = path.resolve(VIRTUAL_VOLUME_DESTINATION_PATHNAME, pathname);
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
    const dollieConfigFileContent = this.readTemplateFile(configFileName).toString();
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
