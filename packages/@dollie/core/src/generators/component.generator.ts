import {
  GeneratorConfig,
} from '../interfaces';
import Generator from './generator.abstract';

class ComponentGenerator extends Generator implements Generator {
  public constructor(
    projectName: string,
    templateId: string,
    config: GeneratorConfig = {},
  ) {
    super(projectName, templateId, config);
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
