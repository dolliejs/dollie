import {
  CACHE_DIR,
} from '../constants';
import fs from 'fs-extra';
import path from 'path';
import { readConfig } from './config';

const getCacheDir = () => {
  return readConfig('cache.dir') || CACHE_DIR;
};

const getCacheFromFilesystem = (url: string): Buffer => {
  const cacheDir = getCacheDir();
  const name = Buffer.from(url).toString('base64');
  const pathname = path.resolve(cacheDir, name);

  if (!fs.existsSync(pathname)) {
    return undefined;
  }

  return fs.readFileSync(path.resolve(cacheDir, name));
};

const setCacheToFilesystem = (url: string, data: Buffer) => {
  const cacheDir = getCacheDir();
  const name = Buffer.from(url).toString('base64');
  const pathname = path.resolve(cacheDir, name);

  if (!fs.existsSync(pathname)) {
    fs.writeFileSync(pathname, data);
  }
};

export {
  getCacheFromFilesystem,
  setCacheToFilesystem,
};
