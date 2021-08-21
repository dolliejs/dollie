import {
  ComponentGeneratorConfig,
  FileTable,
  DiffChange,
  TemplateEntity,
  Question,
} from '../interfaces';
import Generator from './generator.abstract';
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

class ComponentGenerator extends Generator implements Generator {
  private cacheTable: Record<string, DiffChange[]>;
  private componentPathname: string;
  private entities: TemplateEntity[] = [];

  public constructor(
    templateId: string,
    private componentId: string,
    private fileTable: FileTable = {},
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
    this.parseFileTable();
    this.messageHandler('Parse component entities...');
    this.entities = readTemplateEntities(this.volume, this.componentPathname);
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

  public queryAllTemplateProps() {}
  public copyTemplateFileToCacheTable() {}
  public deleteFiles() {}
  public mergeTemplateFiles() {}
  public resolveConflicts() {}
  public runCleanups() {}
  public getResult() {
    return null;
  }

  private parseFileTable() {
    const fileTable = this.fileTable;
    const entries = Object.keys(fileTable);

    for (const entryPathname of entries) {
      const entryContent = fileTable[entryPathname];
      if (_.isString(entryContent)) {
        this.cacheTable[entryPathname] = diff(entryContent);
      }
    }
  }

  private validateComponentProps() {
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

    const componentConfig = _.get(this.templateConfig, `components.${this.componentId}`) || {};
    const questions = (componentConfig.questions || []) as Question[];

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
}

export default ComponentGenerator;
