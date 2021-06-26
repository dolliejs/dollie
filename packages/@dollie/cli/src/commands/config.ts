import commander from 'commander';
import { DollieCLIConfigSchema } from '../utils/config';

export default (config: DollieCLIConfigSchema) => {
  const command = new commander.Command('config');

  command
    .description('Set value to a configuration key')
    .arguments('[key] [value]')
    .action((key: string, value: string) => {
      console.log(key, value);
    });

  return command;
};
