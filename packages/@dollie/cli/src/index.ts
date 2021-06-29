import commands from './commands';
import commander from 'commander';
import _ from 'lodash';
import { initializeConfig } from './init';
import { readConfig } from './utils/config';
import fs from 'fs';
import path from 'path';

initializeConfig();
const config = readConfig();

const packageJsonContent =
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
  || '{}';
const packageJson = JSON.parse(packageJsonContent);

const program = new commander.Command();

program.version(packageJson.version || 'unknown');

for (const commandKey of Object.keys(commands)) {
  const commandGenerator = commands[commandKey];
  if (_.isFunction(commandGenerator)) {
    program.addCommand(commandGenerator(config));
  }
}

program.parse(process.argv);
