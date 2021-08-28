import commander from 'commander';
import _ from 'lodash';
import {
  CLIConfigSchema,
} from '../utils/config';
import Table from 'cli-table3';
import fs from 'fs-extra';
import path from 'path';
import { OriginHandler } from '@dollie/origins';
import { OriginConfigSchema } from '../utils/origins';
import Command from '../command.abstract';
import { getCacheDir } from '../utils/cache';

class OriginCommand extends Command implements Command {
  public constructor(
    program: commander.Command,
    originHandler: OriginHandler,
    cliConfig: CLIConfigSchema,
    originConfig: OriginConfigSchema,
  ) {
    super('cache', program, originHandler, cliConfig, originConfig);
  }

  protected createCommand(command: commander.Command) {
    const cacheDir = getCacheDir();

    command.description('manage CLI cache');

    command
      .command('list')
      .description('list all cache items')
      .action(() => {
        let cachedTemplateLabels: string[] = [];

        try {
          cachedTemplateLabels = fs.readdirSync(cacheDir);
        } catch {}

        if (cachedTemplateLabels.length > 0) {
          const table = new Table({
            head: ['Index', 'URL'],
          });

          for (const [index, cachedTemplateLabel] of cachedTemplateLabels.entries()) {
            table.push([index, Buffer.from(cachedTemplateLabel, 'base64').toString()]);
          }

          console.log(table.toString());
        }
      });

    command
      .command('delete')
      .description('delete a cache item by index')
      .arguments('[index]')
      .action((index: string) => {
        let cachedTemplateLabels: string[] = [];

        try {
          cachedTemplateLabels = fs.readdirSync(cacheDir);
        } catch {}

        const templateLabel = cachedTemplateLabels[index];

        if (!templateLabel || !_.isString(templateLabel)) {
          return;
        }

        fs.removeSync(path.resolve(cacheDir, templateLabel));
      });

    command
      .command('clear')
      .description('clear all cached templates')
      .action(() => {
        if (!fs.existsSync(cacheDir)) {
          return;
        }

        fs.removeSync(cacheDir);
        fs.mkdirpSync(cacheDir);
      });

    return command;
  }
}

export default OriginCommand;
