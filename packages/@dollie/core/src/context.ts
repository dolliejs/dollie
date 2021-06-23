import _ from 'lodash';
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
    const lifecycleList = ['bootstrap', 'load', 'write', 'conflict', 'end'];
    for (const lifecycle of lifecycleList) {
      const lifecycleExecutor = this[lifecycle];
      if (_.isFunction(lifecycleExecutor)) {
        await lifecycleExecutor.call(this);
      }
    }
    return this.generator.getResult();
  }

  protected bootstrap() {
    const {
      projectName,
      templateOriginName,
      config,
    } = this;
    this.generator = new Generator(projectName, templateOriginName, config);
    this.generator.checkInputs();
    this.generator.initialize();
    this.generator.checkContext();
  }

  protected async load() {
    await this.generator.loadTemplate();
    await this.generator.queryAllTemplateProps();
  }

  protected write() {
    this.generator.copyTemplateFileToCacheTable();
    this.generator.deleteFiles();
    this.generator.mergeTemplateFiles();
  }

  protected async conflict() {
    await this.generator.resolveConflicts();
  }

  protected async end() {
    await this.generator.runCleanups();
  }
}

export default Context;
