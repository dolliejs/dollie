import commander from 'commander';
import { OriginHandler } from '../../origins/lib';
import { CLIConfigSchema } from './utils/config';
import { OriginConfigSchema } from './utils/origins';
import _ from 'lodash';

abstract class Command {
  public constructor(
    private readonly name: string,
    private readonly program: commander.Command,
    protected readonly originHandler: OriginHandler,
    protected readonly cliConfig: CLIConfigSchema,
    protected readonly originConfig: OriginConfigSchema,
  ) {}

  public register() {
    const command = this.createCommand(new commander.Command(this.name));
    if (command instanceof commander.Command) {
      this.program.addCommand(command);
    }
  }

  protected abstract createCommand(command: commander.Command): commander.Command;
}

export default Command;
