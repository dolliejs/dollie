import fs from 'fs';
import _ from 'lodash';
import {
  LoaderConfig,
} from '@dollie/core';
import { SYSTEM_CONFIG_PATHNAME } from '../constants';

interface CLIConfigSchema {
  loader?: LoaderConfig;
}

const readConfig = (): CLIConfigSchema => {
  if (
    !fs.existsSync(SYSTEM_CONFIG_PATHNAME) ||
    !fs.statSync(SYSTEM_CONFIG_PATHNAME).isFile()
  ) {
    return {};
  }

  const content = fs.readFileSync(SYSTEM_CONFIG_PATHNAME).toString();

  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

const writeConfig = (key: string, value: any) => {
  if (
    !fs.existsSync(SYSTEM_CONFIG_PATHNAME) ||
    !fs.statSync(SYSTEM_CONFIG_PATHNAME).isFile()
  ) {
    return;
  }

  const content = fs.readFileSync(SYSTEM_CONFIG_PATHNAME).toString();

  let parsedConfig;

  try {
    parsedConfig = JSON.parse(content);
  } catch {}

  if (!parsedConfig) {
    return;
  }

  const newConfig = _.set(parsedConfig, key, value);
  fs.writeFileSync(SYSTEM_CONFIG_PATHNAME, JSON.stringify(newConfig, null, 2));
};

export {
  readConfig,
  writeConfig,
  CLIConfigSchema,
};
