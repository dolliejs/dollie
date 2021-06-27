import commander from 'commander';
import { loadOrigins } from '@dollie/origins';
import {
  DollieCLIConfigSchema,
} from '../utils/config';
import { Context } from '@dollie/core';
import { writeGeneratedFiles } from '../utils/writer';
import {
  ErrorLogger,
  InfoLogger,
} from '../logger';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('init');

  command
    .description('Init a project with an appropriate template')
    .arguments('[template] [name]')
    .action(async (template: string, name: string) => {
      const origins = await loadOrigins(config.origins || {});
      const errorLogger = new ErrorLogger();
      const infoLogger = new InfoLogger();

      const context = new Context(name, template, {
        generator: {
          origins,
        },
        onMessage: infoLogger.log,
        onError: (error) => errorLogger.log(error.message),
      });

      const result = await context.generate();
      // TODO: test
      writeGeneratedFiles(result);
    });

  return command;
};
