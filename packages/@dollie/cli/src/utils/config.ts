import fs from 'fs';
import _ from 'lodash';
import { LoaderConfig } from '../../../core/lib/interfaces';
import { SYSTEM_CONFIG_PATHNAME } from '../constants';

interface DollieCLIConfigSchema {
  origin?: Record<string, string>;
  origins?: Record<string, string>;
  loader?: LoaderConfig;
}

const readConfig = (): DollieCLIConfigSchema => {
  if (
    !fs.existsSync(SYSTEM_CONFIG_PATHNAME)
    || !fs.statSync(SYSTEM_CONFIG_PATHNAME).isFile()
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
    !fs.existsSync(SYSTEM_CONFIG_PATHNAME)
    || !fs.statSync(SYSTEM_CONFIG_PATHNAME).isFile()
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
  DollieCLIConfigSchema,
};
