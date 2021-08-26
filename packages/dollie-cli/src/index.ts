import commands from './commands';
import commander from 'commander';
import _ from 'lodash';
import {
  initialize,
} from './init';
import {
  readConfig,
} from './utils/config';
import fs from 'fs';
import path from 'path';
import {
  OriginConfigSchema,
  readOriginConfig,
} from './utils/origins';
import {
  loadOrigins,
  Origin,
} from '@dollie/origins';

initialize();
const cliConfig = readConfig();
const originConfig = readOriginConfig() as OriginConfigSchema;

const packageJsonContent =
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8') || '{}';
const packageJson = JSON.parse(packageJsonContent);

loadOrigins(originConfig.origins).then((origins) => {
  let selectedOrigin: Origin;
  const selectedOriginHandlerId = originConfig.selectedOriginId || 'github';

  if (selectedOriginHandlerId) {
    selectedOrigin = origins.find((origin) => origin.name === selectedOriginHandlerId);
  }

  return _.get(selectedOrigin, 'handler');
}).then((originHandler) => {
  const program = new commander.Command();

  program.version(packageJson.version || 'unknown');

  for (const commandName of Object.keys(commands)) {
    const CurrentCommand = commands[commandName];
    const currentCommand = new CurrentCommand(program, originHandler, cliConfig, originConfig);
    currentCommand.register();
  }

  program.parse(process.argv);
});
