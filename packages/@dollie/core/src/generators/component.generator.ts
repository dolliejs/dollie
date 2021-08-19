import {
  GeneratorConfig,
  FileTable,
} from '../interfaces';
import Generator from './generator.abstract';

class ComponentGenerator extends Generator implements Generator {
  public constructor(
    templateId: string,
    private fileTable: FileTable,
    config: GeneratorConfig = {},
  ) {
    super(templateId, config);
  }

  // TODO: implementation
  public checkInputs() {}
  public initialize() {}
  public queryAllTemplateProps() {}
  public copyTemplateFileToCacheTable() {}
  public deleteFiles() {}
  public mergeTemplateFiles() {}
  public resolveConflicts() {}
  public runCleanups() {}
  public getResult() {
    return null;
  }
}

export default ComponentGenerator;
