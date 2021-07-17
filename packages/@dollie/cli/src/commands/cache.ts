import commander from 'commander';
import _ from 'lodash';
import Table from 'cli-table3';
import fs from 'fs-extra';
import {
  CACHE_DIR,
} from '../constants';
import path from 'path';

export default () => {
  const command = new commander.Command('cache');

  command.description('manage CLI cache');

  command
    .command('list')
    .description('list all cache items')
    .action(() => {
      let cachedTemplateLabels: string[] = [];

      try {
        cachedTemplateLabels = fs.readdirSync(CACHE_DIR);
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
        cachedTemplateLabels = fs.readdirSync(CACHE_DIR);
      } catch {}

      const templateLabel = cachedTemplateLabels[index];

      if (!templateLabel || !_.isString(templateLabel)) {
        return;
      }

      fs.removeSync(path.resolve(CACHE_DIR, templateLabel));
    });

  command
    .command('clear')
    .description('clear all cached templates')
    .action(() => {
      if (!fs.existsSync(CACHE_DIR)) {
        return;
      }

      fs.removeSync(CACHE_DIR);
      fs.mkdirpSync(CACHE_DIR);
    });

  return command;
};
