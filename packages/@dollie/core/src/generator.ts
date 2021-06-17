import { DollieConfig, DollieTemplateConfig, FileSystem } from './interfaces';
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

class Generator {
  public templateName: string;
  public templateOrigin: string;
  protected origins: DollieOrigin[];
  protected volume: FileSystem;

  public constructor(
    private templateOriginName: string,
    private config: DollieConfig = {},
  ) {
    this.templateName = '';
    this.templateOrigin = '';
    this.origins = [githubOrigin, gitlabOrigin];
    this.volume = new Volume();
  }

  public checkInputs() {
    if (!this.templateOriginName || !_.isString(this.templateOriginName)) {
      throw new InvalidInputError('name should be a string');
    }
  };

  public async initialize() {
    const { origins: customOrigins = [] } = this.config;
    this.origins = this.origins.concat(customOrigins);
    if (_.isString(this.templateOriginName)) {
      [this.templateName, this.templateOrigin = 'github'] = this.templateOriginName.split(':');
    }
  };

  public checkContext() {
    const originIds = this.origins.map((origin) => origin.name);
    const uniqueOriginIds = _.uniq(originIds);
    if (originIds.length > uniqueOriginIds.length) {
      throw new ContextError('duplicated origin names');
    }
  };

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
  };

  public getTemplateConfig() {
    let configFileName: string;
    if (this.checkFile('dollie.json')) {
      configFileName = 'dollie.json';
    } else if (this.checkFile('dollie.js')) {
      configFileName = 'dollie.js';
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
  };

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
  };
}

export default Generator;
