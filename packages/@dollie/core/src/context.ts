import Generator from './generator';
import { DollieConfig } from './interfaces';

class Context {
  protected generator: Generator;

  public constructor(
    protected projectName: string,
    private templateOriginName: string,
    private config: DollieConfig = {},
  ) {}

  public async generate() {
    const {
      projectName,
      templateOriginName,
      config,
    } = this;
    this.generator = new Generator(projectName, templateOriginName, config);
    this.generator.checkInputs();
    this.generator.initialize();
    this.generator.checkContext();
    await this.generator.loadTemplate();
    await this.generator.queryAllTemplateProps();
    this.generator.copyTemplateFileToCacheTable();
    this.generator.deleteFiles();
    this.generator.mergeTemplateFiles();
    await this.generator.resolveConflicts();
    this.generator.runCleanups();
    return this.generator.getResult();
  }
}

export default Context;
