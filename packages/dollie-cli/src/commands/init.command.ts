import commander from 'commander';
import Command from '../command.abstract';
import figlet from 'figlet';
import chalk from 'chalk';
import _ from 'lodash';
import { writeGeneratedFiles } from '../utils/writer';
import {
  getCacheFromFilesystem,
  setCacheToFilesystem,
} from '../utils/cache';
import inquirer, { Question } from 'inquirer';
import {
  Context,
  ConflictSolverData,
  ConflictSolveResult,
  parseFileTextToMergeBlocks,
} from '@dollie/core';
import {
  ErrorLogger,
  InfoLogger,
} from '../logger';
import {
  ConflictSolveApproachType,
  ManualResult,
} from '../interfaces';
import { OriginHandler } from '@dollie/origins';
import { CLIConfigSchema } from '../utils/config';
import { OriginConfigSchema } from '../utils/origins';

const conflictsSolver = async (
  data: ConflictSolverData,
  onMessage: (message: string) => Promise<void> | void = _.noop,
): Promise<ConflictSolveResult> => {
  const {
    block: originalMergeBlock,
    total,
    index,
    pathname,
  } = data;
  const block = _.clone(originalMergeBlock);

  const lines = _.flatten(['former', 'current'].map((type) => {
    return ((_.get(block, `values.${type}`) || []) as string[]).map((line) => {
      return `[${type}] ${line.slice(0, -1)}`;
    });
  }));

  await onMessage(
    'Solving ' +
    (index + 1) +
    ' of ' +
    total +
    ' conflicts in `' +
    pathname +
    '`:\n' +
    lines.join('\n'),
  );

  let approachType: ConflictSolveApproachType;
  const approachTypeAnswer = await inquirer.prompt(
    [
      {
        name: 'type',
        type: 'list',
        message: 'Select an appropriate approach to solve this conflict',
        choices: [
          {
            value: 'simple',
            name: 'Simply select which group should be kept',
          },
          {
            value: 'select',
            name: 'Select conflicted lines to be kept manually',
          },
          {
            value: 'edit',
            name: 'Open an editor to edit the whole file',
          },
          {
            value: 'ignore',
            name: 'Ignore this conflict',
          },
        ],
      },
    ],
  );
  approachType = approachTypeAnswer.type as ConflictSolveApproachType;

  if (!approachType) {
    return null;
  }

  if (!['simple', 'select', 'edit', 'ignore'].includes(approachType)) {
    approachType = 'simple';
  }

  let conflictSolveResult: ConflictSolveResult;

  switch (approachType) {
    case 'ignore': {
      return 'ignored';
    }

    case 'simple': {
      const { result } = (await inquirer.prompt(
        [
          {
            name: 'result',
            type: 'list',
            message: 'Select a group of lines which you want to keep',
            choices: [
              {
                value: 'all',
                name: 'I want to keep all lines',
              },
              {
                value: 'none',
                name: 'I want to discard all lines',
              },
            ],
          },
        ],
      )) as { result: ManualResult };

      switch (result) {
        case 'all': {
          block.values.current = Array
            .from(block.values.former)
            .concat(Array.from(block.values.current));
          block.values.former = [];
          break;
        }
        case 'none': {
          block.values.former = [];
          block.values.current = [];
          break;
        }
        default:
          break;
      }

      block.status = 'OK';
      conflictSolveResult = block;
      break;
    }

    case 'select': {
      const { keeps } = (await inquirer.prompt(
        [
          {
            name: 'keeps',
            type: 'checkbox',
            message: 'Select the lines that should be kept:',
            choices: lines.map((line) => ({
              name: line,
              value: line,
            })),
          },
        ],
      )) as { keeps: string[] };

      block.values.former = [];
      block.values.current = [];

      for (const keep of keeps) {
        const formerFlag = '[former] ';
        const currentFlag = '[current] ';

        let currentLine: string;

        if (keep.startsWith(formerFlag)) {
          currentLine = keep.slice(formerFlag.length);
        } else if (keep.startsWith(currentFlag)) {
          currentLine = keep.slice(currentFlag.length);
        }

        if (currentLine) {
          block.values.current.push(`${currentLine}\n`);
        }
      }

      conflictSolveResult = block;
      break;
    }

    case 'edit': {
      const { content } = (await inquirer.prompt(
        [
          {
            type: 'editor',
            name: 'content',
            message: 'Edit conflicts with editor',
            default: block.values.former
              .concat(block.values.current)
              .map((value) => value.slice(0, -1))
              .join('\n'),
          },
        ],
      )) as { content: string };

      [conflictSolveResult] = parseFileTextToMergeBlocks(content);
      break;
    }

    default:
      break;
  }

  await onMessage(
    'Here is the result of currently-solved conflict:\n' +
    (
      _.isString(conflictSolveResult)
        ? conflictSolveResult
        : ((_.get(conflictSolveResult, 'values.current') || []) as string[]).join('')
    ),
  );

  const { confirm } = await inquirer.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      message: 'Do you confirm this result?',
    },
  ]) as { confirm: boolean };

  if (confirm) {
    return conflictSolveResult;
  } else {
    return null;
  }
};

class InitCommand extends Command implements Command {
  public constructor(
    program: commander.Command,
    originHandler: OriginHandler,
    cliConfig: CLIConfigSchema,
    originConfig: OriginConfigSchema,
  ) {
    super('init', program, originHandler, cliConfig, originConfig);
  }

  protected createCommand(command: commander.Command) {
    const {
      cliConfig,
      originHandler,
    } = this;

    command
      .description('init a project with an appropriate template')
      .arguments('[name]')
      .requiredOption('-t, --template <id>', 'a template ID that can be understood by selected origin handler')
      .action(async (name: string) => {
        const { template } = command.opts();
        console.log(figlet.textSync('dollie.js'));
        try {
          const errorLogger = new ErrorLogger();
          const infoLogger = new InfoLogger();

          const context = new Context(template, {
            type: 'project',
            generator: {
              origin: cliConfig.origin || {},
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
              conflictsSolver: async (data) => {
                return await conflictsSolver(data, async (message) => {
                  infoLogger.log(message);
                  return Promise.resolve();
                });
              },
              setCache: (url: string, data: Buffer) => {
                setCacheToFilesystem(url, data);
              },
              getCache: async (url) => {
                return getCacheFromFilesystem(url);
              },
            },
            onMessage: (message: string) => infoLogger.log(message),
          });

          const result = await context.generate();

          if (result) {
            writeGeneratedFiles(result, name);
          }

          if (_.isArray(result.conflicts) && result.conflicts.length > 0) {
            infoLogger.log(
              'Generated template files with ' +
            result.conflicts.length +
            ' ignored conflicted file(s):\n' +
            result.conflicts.map((conflict) => {
              return chalk.yellow(` - ${conflict}`);
            }).join('\n'),
            );
          }
        } catch {}
      });

    return command;
  }
}

export default InitCommand;
