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
import _ from 'lodash';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('init');

  command
    .description('init a project with an appropriate template')
    .arguments('[template] [name]')
    .action(async (template: string, name: string) => {
      try {
        const origins = await loadOrigins(config.origins || {});
        const errorLogger = new ErrorLogger();
        const infoLogger = new InfoLogger();

        const context = new Context(name, template, {
          generator: {
            origins,
            loader: _.get(config, 'loader'),
          },
          onMessage: (message) => infoLogger.log(message),
          onError: (error) => {
            errorLogger.log(error.message);
            process.exit(1);
          },
        });

        const result = await context.generate();

        if (result) {
          writeGeneratedFiles(result);
        }
      } catch {}
    });

  return command;
};
