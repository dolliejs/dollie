import got from 'got';
import _ from 'lodash';
import {
  DollieOrigin,
  DollieOriginConfig,
} from './interfaces';
import fs from 'fs';
import requireFromString from 'require-from-string';

const isUrl = (url: string) => {
  return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(url);
};

const loadOrigins = async (config: DollieOriginConfig): Promise<DollieOrigin[]> => {
  const result = [];

  for (const name of Object.keys(config)) {
    const pathname = config[name];
    if (!_.isString(pathname)) { continue; }
    let content: string;
    if (!isUrl(pathname)) {
      content = (await got(pathname)).body;
    } else {
      content = fs.readFileSync(pathname).toString();
    }
    if (!content || !_.isString(content)) { continue; }
    result.push(requireFromString(content));
  }

  return result;
};

export {
  loadOrigins,
};
