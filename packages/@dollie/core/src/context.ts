import Generator from './generator';
import { DollieConfig } from './interfaces';

class Context {
  protected generator: Generator;

  public constructor(
    private templateOriginName: string,
    private config: DollieConfig = {},
    protected projectName: string,
  ) {}

  public async generate() {
    const {
      templateOriginName,
      config,
      projectName,
    } = this;
    this.generator = new Generator(templateOriginName, config, projectName);
    this.generator.checkInputs();
    this.generator.initialize();
    this.generator.checkContext();
    await this.generator.loadTemplate();
  }
}

export default Context;
