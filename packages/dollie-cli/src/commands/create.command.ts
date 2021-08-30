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
import {
  ModuleContextConfig,
  TemplateFileItem,
  FileContent,
} from '@dollie/core/lib/interfaces';
import {
  readEntities,
} from '@dollie/utils';
import fs from 'fs';
import path from 'path';

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
        console.log(figlet.textSync('dollie.js'));

        const projectBasePathname = process.cwd();
        const gitIgnoreFilePathname = path.resolve(projectBasePathname, '.gitignore');
        let gitIgnoreFileContent: string;

        if (fs.existsSync(gitIgnoreFilePathname)) {
          gitIgnoreFileContent = fs.readFileSync(gitIgnoreFilePathname).toString();
        }

        const files = readEntities(fs, projectBasePathname, gitIgnoreFileContent).map((entity) => {
          const {
            absoluteOriginalPathname,
            isBinary,
            isDirectory,
          } = entity;

          let content: FileContent;

          if (isDirectory) {
            return entity as TemplateFileItem;
          }

          content = fs.readFileSync(absoluteOriginalPathname);

          if (!isBinary) {
            content = content.toString();
          }

          return {
            ...entity,
            content,
          } as TemplateFileItem;
        });

        const {
          template: templateId,
          module: moduleId,
        } = command.opts();

        try {
          const errorLogger = new ErrorLogger();
          const infoLogger = new InfoLogger();

          const context = new Context(templateId, {
            type: 'module',
            generator: {
              moduleId,
              origin: originConfig.origin || {},
              loader: _.get(cliConfig, 'loader'),
              files,
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
