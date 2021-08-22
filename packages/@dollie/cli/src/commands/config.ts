import commander from 'commander';
import _ from 'lodash';
import {
  writeConfig,
  readConfig,
} from '../utils/config';
import { CACHE_DIR } from '../constants';
import fs from 'fs-extra';
import path from 'path';
import { CommandGeneratorContext } from '../interfaces';

export default ({
  cliConfig,
}: CommandGeneratorContext) => {
  const command = new commander.Command('config');

  command.description('manage CLI configurations');

  command
    .command('set')
    .description('set value to CLI configuration item')
    .arguments('[key] [value]')
    .action((key: string, value: string) => {
      const relativePathKeyList = ['cache.dir'];
      let configValue: string = value;

      if (relativePathKeyList.indexOf(key) !== -1) {
        configValue = path.resolve(process.cwd(), value);
      }

      if (key === 'cache.dir') {
        const cacheDir = readConfig('cache.dir') || CACHE_DIR;
        fs.removeSync(cacheDir);
      }

      writeConfig(key, configValue);
    });

  command
    .command('get')
    .description('get value from CLI configuration item')
    .arguments('[key]')
    .action((key: string) => {
      console.log(_.get(cliConfig, key) || '');
    });

  command
    .command('delete')
    .description('delete value from CLI configuration item')
    .arguments('[key]')
    .action((key: string) => {
      const [configPath] = key.split('.').slice(-1);
      const parentConfigPath = key.split('.').slice(0, -1).join('.');
      const configItem = _.get(cliConfig, key) || {};
      const newConfigItem = Object.keys(configItem).reduce((result, currentKey) => {
        if (configPath !== currentKey) {
          result[configPath] = configItem[configPath];
        }
        return result;
      }, {});

      writeConfig(parentConfigPath, newConfigItem);
    });

  return command;
};
