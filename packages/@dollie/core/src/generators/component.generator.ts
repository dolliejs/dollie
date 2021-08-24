import {
  ComponentGeneratorConfig,
  FileTable,
  ComponentProps,
  TemplateFileItem,
} from '../interfaces';
import {
  Answers as InquirerAnswers,
} from 'inquirer';
import Generator from '../generator.abstract';
import _ from 'lodash';
import {
  diff,
} from '../diff';
import {
  ParameterInvalidError,
  ComponentInvalidError,
  ComponentNotFoundError,
} from '../errors';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX,
} from '../constants';
import {
  readTemplateEntities,
} from '../utils/loader';
import mustache from 'mustache';
import { getComponentFileConfigGlobs } from '../utils/files';
import { GlobMatcher } from '../utils/matchers';
import {
  TemplateEntity,
} from '@dollie/utils';
import ejs from 'ejs';

class ComponentGenerator extends Generator implements Generator {
  private componentPathname: string;
  private entities: TemplateEntity[] = [];
  private componentTemplateConfig: ComponentProps = {};
  private componentProps: InquirerAnswers = {};
  private fileTable: FileTable = {};

  public constructor(
    templateId: string,
    private componentId: string,
    private files: TemplateFileItem[],
    config: ComponentGeneratorConfig = {},
  ) {
    super(templateId, config);
    this.componentPathname = TEMPLATE_CACHE_PATHNAME_PREFIX + '/components/' + this.componentId;
  }

  public checkInputs() {
    super.checkInputs();

    if (!this.fileTable || !_.isObjectLike(this.fileTable)) {
      throw new ParameterInvalidError('fileTable');
    }

    if (!this.componentId || !_.isString(this.componentId)) {
      throw new ParameterInvalidError('componentId');
    }
  }

  public initialize() {
    this.messageHandler('Parsing project files...');
    this.parseProjectFiles();
    this.messageHandler('Initialization finished successfully');
  }

  public async checkContext() {
    await super.checkContext();

    if (!this.volume.existsSync(this.componentPathname)) {
      throw new ComponentNotFoundError(this.componentId);
    }

    if (!this.volume.statSync(this.componentPathname).isDirectory()) {
      throw new ComponentInvalidError(this.componentId);
    }
  }

  public async loadTemplate() {
    const duration = await super.loadTemplate();

    this.componentTemplateConfig = _.get(this.templateConfig, `components.${this.componentId}`) || {};
    const {
      alias = {},
    } = this.componentTemplateConfig;

    this.messageHandler('Parsing component entities...');
    this.entities = readTemplateEntities(this.volume, this.componentPathname).map((entity) => {
      const {
        relativePathname,
      } = entity;

      if (/\{\{.*\}\}/g.test(relativePathname)) {
        return entity;
      }

      const targetAliasPathname = alias[relativePathname];

      if (!_.isString(targetAliasPathname)) {
        return entity;
      }

      return {
        ...entity,
        relativePathname: targetAliasPathname,
      };
    });

    this.validateComponentProps();

    return duration;
  }

  public async queryAllTemplateProps() {
    const {
      questions = [],
    } = this.componentTemplateConfig;

    const { getTemplateProps } = this.config;

    if (_.isFunction(getTemplateProps) && questions.length > 0) {
      this.componentProps = await getTemplateProps(questions);
    }

    const patterns = await this.generateFilePatterns();
    this.matcher = new GlobMatcher(patterns);

    return _.clone(this.componentProps);
  }

  public copyTemplateFileToCacheTable() {
    for (const entity of this.entities) {
      const {
        relativePathname,
        absoluteOriginalPathname,
        isBinary,
        isDirectory,
      } = entity;

      if (isDirectory) {
        continue;
      }

      const entityPathname = mustache.render(relativePathname, this.componentProps);
      const contentBuffer = this.volume.readFileSync(absoluteOriginalPathname);

      if (isBinary) {
        this.binaryTable[entityPathname] = contentBuffer as Buffer;
        continue;
      }

      const content = ejs.render(contentBuffer.toString(), this.componentProps);

      if (!_.isArray(this.cacheTable[entityPathname])) {
        this.cacheTable[entityPathname] = [diff(content)];
      } else {
        const originalContent = this.fileTable[entityPathname];
        const diffChange = _.isString(originalContent)
          ? diff(originalContent, content)
          : diff(content);
        this.cacheTable[entityPathname].push(diffChange);
      }
    }
  }

  public resolveConflicts() {}

  public runCleanups() {}

  public getResult() {
    return null;
  }

  private parseProjectFiles() {
    for (const fileItem of this.files) {
      const {
        relativePathname,
        isBinary,
        isDirectory,
        content,
      } = fileItem;

      if (isDirectory) {
        continue;
      }

      if (isBinary && _.isBuffer(content)) {
        this.binaryTable[relativePathname] = content as Buffer;
        continue;
      }

      if (!isBinary && _.isString(content)) {
        this.fileTable[relativePathname] = content;
        continue;
      }
    }
  }

  private validateComponentProps() {
    const {
      questions = [],
    } = this.componentTemplateConfig;

    const dependedProps = this.entities.reduce((tempResult, currentEntity) => {
      const {
        relativePathname,
      } = currentEntity;
      const currentResult = Array.from(tempResult);
      const spans = mustache.parse(relativePathname);

      for (const span of spans) {
        const [type, name] = span;
        if (type === 'name') {
          currentResult.push(name);
        }
      }

      return currentResult;
    }, []);

    const providedProps = questions.map((question) => question.name);

    if (providedProps.length < dependedProps.length) {
      return false;
    }

    for (const providedPropName of providedProps) {
      if (!dependedProps.includes(providedPropName)) {
        return false;
      }
    }

    return true;
  }

  private async generateFilePatterns() {
    return {
      delete: await getComponentFileConfigGlobs(
        this.templateConfig,
        this.componentTemplateConfig,
        this.componentProps,
      ),
    };
  }
}

export default ComponentGenerator;
