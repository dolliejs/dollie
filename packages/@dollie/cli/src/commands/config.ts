import commander from 'commander';
import _ from 'lodash';
import {
    DollieCLIConfigSchema,
    writeConfig,
} from '../utils/config';

export default (config: DollieCLIConfigSchema) => {
    const command = new commander.Command('config');

    command.description('manage CLI configurations');

    command
        .command('set')
        .description('set value to CLI configuration item')
        .arguments('[key] [value]')
        .action((key: string, value: string) => {
            writeConfig(key, value);
        });

    command
        .command('get')
        .description('get value from CLI configuration item')
        .arguments('[key]')
        .action((key: string) => {
            console.log(_.get(config, key) || '');
        });

    command
        .command('delete')
        .description('delete value from CLI configuration item')
        .arguments('[key]')
        .action((key: string) => {
            const [configPath] = key.split('.').slice(-1);
            const parentConfigPath = key.split('.').slice(0, -1).join('.');
            const configItem = _.get(config, key) || {};
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
