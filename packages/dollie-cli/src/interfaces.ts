import { OriginHandler } from '@dollie/origins';
import commander from 'commander';
import Command from './command.abstract';
import { CLIConfigSchema } from './utils/config';
import { OriginConfigSchema } from './utils/origins';

export interface CommandGeneratorContext {
  program: commander.Command;
  cliConfig: CLIConfigSchema;
  originConfig: OriginConfigSchema;
  originHandler: OriginHandler;
}

export type ConflictSolveApproachType = 'simple' | 'select' | 'edit' | 'ignore';
export type ManualResult = 'all' | 'none' | 'former' | 'current';
