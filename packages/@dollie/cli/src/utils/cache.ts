import {
  CACHE_DIR,
} from '../constants';
import fs from 'fs-extra';
import path from 'path';

const getCacheFromFilesystem = (url: string): Buffer => {
  const name = Buffer.from(url).toString('base64');
  const pathname = path.resolve(CACHE_DIR, name);

  if (!fs.existsSync(pathname)) {
    return undefined;
  }

  return fs.readFileSync(path.resolve(CACHE_DIR, name));
};

const setCacheToFilesystem = (url: string, data: Buffer) => {
  const name = Buffer.from(url).toString('base64');
  const pathname = path.resolve(CACHE_DIR, name);

  if (!fs.existsSync(pathname)) {
    fs.writeFileSync(pathname, data);
  }
};

export {
  getCacheFromFilesystem,
  setCacheToFilesystem,
};
