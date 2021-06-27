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
import inquirer from 'inquirer';
import { ConflictSolverData, MergeBlock } from '../../../core/lib/interfaces';

export type ConflictSolveApproachType = 'simple' | 'manual' | 'edit' | 'ignore';

// TODO: finish
const conflictSolver = async (
  data: ConflictSolverData,
  onMessage: (message: string) => void,
) => {
  const { block, total, index, pathname } = data;

  if (_.isFunction(onMessage)) {
    onMessage(`Solving ${index + 1} of ${total} conflicts in \`${pathname}\``);
  }

  let approachType: ConflictSolveApproachType;
  const approachTypeAnswer = await inquirer.prompt([
    {
      name: 'type',
      message: 'Select an appropriate approach to solve this conflict',
    },
  ]);
  approachType = approachTypeAnswer.type as ConflictSolveApproachType;

  if (!approachType || !['simple', 'manual', 'edit', 'ignore'].includes(approachType)) {
    approachType = 'simple';
  }
};

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
            getTemplateProps: async (questions) => {
              return await inquirer.prompt(questions);
            },
          },
          onMessage: (message) => infoLogger.log(message),
          onError: (error) => {
            errorLogger.log(error.message);
            process.exit(1);
          },
        });

        const result = await context.generate();

        if (result) {
          writeGeneratedFiles(result, name);
        }
      } catch {}
    });

  return command;
};
