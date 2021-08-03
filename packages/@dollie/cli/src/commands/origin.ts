import commander from 'commander';
import _ from 'lodash';
import {
  DollieCLIConfigSchema,
  writeConfig,
  readConfig,
} from '../utils/config';
import Table from 'cli-table3';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('origin');

  command.description('manage template origins');

  command
    .command('add')
    .alias('register')
    .description('add a template origins')
    .arguments('[name] [pathname]')
    .action((name: string, pathname: string) => {
      writeConfig(`origins.${name}`, pathname);
    });

  command
    .command('delete')
    .description('delete a template origin from origins')
    .arguments('[name]')
    .action((name: string) => {
      const origins = _.get(config, 'origins') || {};
      writeConfig(
        'origins',
        Object.keys(origins).reduce((result, currentName) => {
          if (name !== currentName) {
            result[name] = origins[name];
          }
          return result;
        }, {}),
      );
    });

  command
    .command('list')
    .description('list all registered origins')
    .action(() => {
      const internalOrigins = {
        github: '<internal>',
        gitlab: '<internal>',
      } as Record<string, string>;
      const { origins: customOrigins = {} } = readConfig();

      const table = new Table({
        head: ['ID', 'Source'],
      });

      const origins = _.merge(internalOrigins, customOrigins);

      for (const originName of Object.keys(origins)) {
        table.push([originName, origins[originName] || '<unknown>']);
      }

      console.log(table.toString());
    });

  // TODO: `use` command

  return command;
};
