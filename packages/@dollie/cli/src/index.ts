import commands from './commands';
import commander from 'commander';
import _ from 'lodash';
import { initializeConfig } from './init';
import { readConfig } from './utils/config';

initializeConfig();
const config = readConfig();

const program = new commander.Command();

for (const commandKey of Object.keys(commands)) {
  const commandGenerator = commands[commandKey];
  if (_.isFunction(commandGenerator)) {
    program.addCommand(commandGenerator(config));
  }
}

program.parse(process.argv);
