import commander from 'commander';
import { loadOrigins } from '@dollie/origins';
import {
  DollieCLIConfigSchema,
} from '../utils/config';
import { Context } from '@dollie/core';
import { writeGeneratedFiles } from '../utils/writer';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('init');

  command
    .description('Init a project with an appropriate template')
    .arguments('[template] [name]')
    .action(async (template: string, name: string) => {
      const origins = await loadOrigins(config.origins || {});

      const context = new Context(name, template, {
        generator: {
          origins: origins.map((origin) => origin.handler),
        },
      });

      const result = await context.generate();
      // TODO: test
      writeGeneratedFiles(result);
    });

  return command;
};
