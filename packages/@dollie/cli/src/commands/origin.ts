import commander from 'commander';
import _ from 'lodash';
import {
  DollieCLIConfigSchema,
  writeConfig,
} from '../utils/config';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('origin');

  command.description('manage template origins');

  command
    .command('add')
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

  return command;
};
