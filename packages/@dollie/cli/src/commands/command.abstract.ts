import {
  Origin,
  loadOrigins,
  OriginHandler,
} from '@dollie/origins';
import {
  CLIConfigSchema,
} from '../utils/config';
import {
  OriginConfigSchema,
  readOriginConfig,
} from '../utils/origins';
import commander from 'commander';
import _ from 'lodash';

abstract class Command {
  protected originHandler: OriginHandler;
  private command: commander.Command;
  private origins: Origin[] = [];

  public constructor(
    protected name: string,
    protected cliConfig: CLIConfigSchema,
    protected originConfig: OriginConfigSchema,
  ) {
    this.command = new commander.Command(name);
  }

  public createCommand() {
    this.initialize();
    return this.command;
  }

  protected async loadOriginHandler() {
    await this.loadOrigins();

    let selectedOrigin: Origin;
    const selectedOriginHandlerId = readOriginConfig('selectedOriginId') || 'github';

    if (selectedOriginHandlerId) {
      selectedOrigin = this.origins.find((origin) => origin.name === selectedOriginHandlerId);
    }

    this.originHandler = _.get(selectedOrigin, 'handler');
  }

  private async loadOrigins() {
    const origins = await loadOrigins(this.originConfig.origins || {});
    this.origins = origins || [];
  };

  public abstract initialize(): void;
}

export default Command;
