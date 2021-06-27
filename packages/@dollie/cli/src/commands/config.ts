import commander from 'commander';
import _ from 'lodash';
import {
  DollieCLIConfigSchema,
  writeConfig,
} from '../utils/config';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('config');

  command
    .description('get or set CLI configuration')
    .arguments('[key] [value]')
    .action((key: string, value: string) => {
      if (!value) {
        console.log(_.get(config, 'key'));
        process.exit(0);
      }

      writeConfig(key, value);
    });

  return command;
};
