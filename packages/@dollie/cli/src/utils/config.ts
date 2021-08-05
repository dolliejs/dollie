import fs from 'fs';
import _ from 'lodash';
import {
  LoaderConfig,
} from '@dollie/core';
import {
  SYSTEM_CONFIG_PATHNAME,
} from '../constants';
import {
  readJson,
} from './read-json';

interface CLIConfigSchema {
  loader?: LoaderConfig;
  cache?: CacheConfig;
}

interface CacheConfig {
  dir?: string;
}

const readConfig = (key?: string): any => {
  return readJson(SYSTEM_CONFIG_PATHNAME, key);
};

const writeConfig = (key: string, value: any) => {
  if (
    !fs.existsSync(SYSTEM_CONFIG_PATHNAME) ||
    !fs.statSync(SYSTEM_CONFIG_PATHNAME).isFile()
  ) {
    return;
  }

  const content = fs.readFileSync(SYSTEM_CONFIG_PATHNAME).toString();

  let parsedConfig: CLIConfigSchema;

  try {
    parsedConfig = JSON.parse(content);
  } catch {
    parsedConfig = {};
  }

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
