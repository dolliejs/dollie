import commander from 'commander';
import Command from '../command.abstract';
import figlet from 'figlet';
import _ from 'lodash';
import { writeGeneratedFiles } from '../utils/writer';
import {
  getCacheFromFilesystem,
  setCacheToFilesystem,
} from '../utils/cache';
import inquirer, { Question } from 'inquirer';
import {
  Context,
} from '@dollie/core';
import {
  ErrorLogger,
  InfoLogger,
} from '../logger';
import { OriginHandler } from '@dollie/origins';
import { CLIConfigSchema } from '../utils/config';
import { OriginConfigSchema } from '../utils/origins';
import { ModuleContextConfig } from '@dollie/core/lib/interfaces';

class CreateCommand extends Command implements Command {
  public constructor(
    program: commander.Command,
    originHandler: OriginHandler,
    cliConfig: CLIConfigSchema,
    originConfig: OriginConfigSchema,
  ) {
    super('create', program, originHandler, cliConfig, originConfig);
  }

  protected createCommand(command: commander.Command) {
    const {
      cliConfig,
      originConfig,
      originHandler,
    } = this;

    command
      .description('create a module in an exist project')
      .arguments('[name]')
      .requiredOption('-t, --template <id>', 'a template ID that can be understood by selected origin handler')
      .requiredOption('-m, --module <id>', 'the ID of a module to be used by current lifecycle')
      .action(async (name: string) => {
        const {
          template: templateId,
          module: moduleId,
        } = command.opts();

        console.log(figlet.textSync('dollie.js'));

        try {
          const errorLogger = new ErrorLogger();
          const infoLogger = new InfoLogger();

          const context = new Context(templateId, {
            type: 'module',
            generator: {
              moduleId,
              origin: originConfig.origin || {},
              loader: _.get(cliConfig, 'loader'),
              onError: (error) => {
                errorLogger.log(error.message);
                process.exit(1);
              },
              originHandler,
              getTemplateProps: async (questions: Question[]) => {
                const answers = await inquirer.prompt(questions);
                return answers;
              },
              setCache: (url: string, data: Buffer) => {
                setCacheToFilesystem(url, data);
              },
              getCache: async (url) => {
                return getCacheFromFilesystem(url);
              },
            } as ModuleContextConfig,
            onMessage: (message: string) => infoLogger.log(message),
          });

          const result = await context.generate();

          if (result) {
            writeGeneratedFiles(result, name);
          }
        } catch {}
      });

    return command;
  }
}

export default CreateCommand;
