import commander from 'commander';
import _ from 'lodash';

export default () => {
  const command = new commander.Command('cache');

  command.description('manage CLI cache');

  command
    .command('list')
    .description('list all cache items')
    .action(() => {
      // TODO:
    });

  command
    .command('delete')
    .description('delete a cache item by index')
    .arguments('[index]')
    .action((index: string) => {
      // TODO:
    });

  command
    .command('clear')
    .description('clear all cached templates')
    .action(() => {
      // TODO:
    });

  return command;
};
