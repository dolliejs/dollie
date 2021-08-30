import commander from 'commander';
import _ from 'lodash';
import {
  writeConfig,
  readConfig,
  CLIConfigSchema,
} from '../utils/config';
import { CACHE_DIR } from '../constants';
import fs from 'fs-extra';
import path from 'path';
import Command from '../command.abstract';
import { OriginHandler } from '@dollie/origins';
import { OriginConfigSchema } from '../utils/origins';

class OriginCommand extends Command implements Command {
  public constructor(
    program: commander.Command,
    originHandler: OriginHandler,
    cliConfig: CLIConfigSchema,
    originConfig: OriginConfigSchema,
  ) {
    super('config', program, originHandler, cliConfig, originConfig);
  }

  protected createCommand(command: commander.Command) {
    const {
      cliConfig,
      originConfig,
    } = this;

    const {
      selectedOriginId,
    } = originConfig;

    command.description('manage CLI configurations');

    command
      .command('set')
      .description('set value to CLI configuration item')
      .arguments('[key] [value]')
      .action((key: string, value: string) => {
        const relativePathKeyList = ['cache.dir'];

        if (selectedOriginId === 'dev') {
          relativePathKeyList.push('origin.path');
        }

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
  }
}

export default OriginCommand;
