import { OriginHandler } from '@dollie/origins';
import { CLIConfigSchema } from './utils/config';
import { OriginConfigSchema } from './utils/origins';

export interface CommandGeneratorContext {
  cliConfig: CLIConfigSchema;
  originConfig: OriginConfigSchema;
  originHandler: OriginHandler;
}
