import fs from 'fs-extra';
import {
  CONFIG_DIR,
  SYSTEM_CONFIG_PATHNAME,
  CACHE_DIR,
  ORIGIN_CONFIG_PATHNAME,
} from './constants';
import { readConfig } from './utils/config';

const writeConfig = (pathname: string) => {
  fs.writeFileSync(pathname, JSON.stringify({}, null, 2));
};

const initializeDir = (pathname: string) => {
  const dirExistence = fs.existsSync(pathname);

  if (!dirExistence) {
    fs.mkdirpSync(pathname);
  }

  const dirStat = fs.statSync(pathname);

  if (!dirStat.isDirectory()) {
    try {
      fs.removeSync(pathname);
      fs.mkdirpSync(pathname);
    } catch {}
  }
};

const initializeFile = (pathname: string) => {
  const fileExistence = fs.existsSync(pathname);
  if (!fileExistence) {
    writeConfig(pathname);
  }
};

export const initialize = () => {
  const cacheDir = readConfig('cache.dir') || CACHE_DIR;
  const dirs = [CONFIG_DIR, cacheDir];
  const files = [SYSTEM_CONFIG_PATHNAME, ORIGIN_CONFIG_PATHNAME];

  for (const dir of dirs) {
    initializeDir(dir);
  }

  for (const file of files) {
    initializeFile(file);
  }
};
