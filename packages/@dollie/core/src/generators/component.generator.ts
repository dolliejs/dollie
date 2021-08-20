import {
  ComponentGeneratorConfig,
  FileTable,
  DiffChange,
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

class ComponentGenerator extends Generator implements Generator {
  private cacheTable: Record<string, DiffChange[]>;
  private componentPathname: string;

  public constructor(
    templateId: string,
    private componentId: string,
    private fileTable: FileTable = {},
    config: ComponentGeneratorConfig = {},
  ) {
    super(templateId, config);
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
    this.componentPathname = TEMPLATE_CACHE_PATHNAME_PREFIX + '/components/' + this.componentId;
    this.messageHandler('Parsing project files...');
    this.parseFileTable();
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
}

export default ComponentGenerator;
