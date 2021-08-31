import got from 'got';
import _ from 'lodash';
import {
  Origin,
  OriginMap,
} from './interfaces';
import fs from 'fs';
import requireFromString from 'require-from-string';
import {
  githubOrigin,
  gitlabOrigin,
  devOrigin,
} from './index';
import path from 'path';
import {
  validate,
} from '@dollie/utils';

const isUrl = (url: string) => {
  return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(url);
};

const loadOrigins = async (originMap: OriginMap = {}): Promise<Origin[]> => {
  const result: Origin[] = [];

  for (const name of Object.keys(originMap)) {
    const pathnameOrHandler = originMap[name];

    if (_.isFunction(pathnameOrHandler)) {
      result.push({
        name,
        handler: pathnameOrHandler,
      });
    } else if (_.isString(pathnameOrHandler)) {
      try {
        let source: string;

        if (isUrl(pathnameOrHandler)) {
          source = (await got(pathnameOrHandler)).body;
        } else {
          const originHandlerFilePathname = path.resolve(process.cwd(), pathnameOrHandler);
          if (!fs.existsSync(originHandlerFilePathname)) {
            continue;
          }
          const stat = fs.statSync(originHandlerFilePathname);
          if (stat.isFile()) {
            source = fs.readFileSync(originHandlerFilePathname).toString();
          }
        }

        if (
          !source ||
          !_.isString(source) ||
          (process.env.NODE_ENV !== 'development' && !validate(source))
        ) {
          continue;
        }

        const handlerFunc = requireFromString(source);

        if (!_.isFunction(handlerFunc)) { continue; }

        result.push({
          name,
          handler: handlerFunc,
        });
      } catch {
        continue;
      }
    } else {
      continue;
    }
  }

  return [
    {
      name: 'github',
      handler: githubOrigin,
    },
    {
      name: 'gitlab',
      handler: gitlabOrigin,
    },
    {
      name: 'dev',
      handler: devOrigin,
    },
  ].concat(result);
};

export {
  loadOrigins,
};
