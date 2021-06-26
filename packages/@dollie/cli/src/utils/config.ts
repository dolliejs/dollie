import fs from 'fs';
import { SYSTEM_CONFIG_PATHNAME } from '../constants';

interface DollieCLIConfigSchema {
  origins?: Record<string, string>;
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

export {
  readConfig,
  DollieCLIConfigSchema,
};
