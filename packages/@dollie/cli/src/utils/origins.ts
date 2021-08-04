import fs from 'fs-extra';
import _ from 'lodash';
import {
  ORIGIN_CONFIG_PATHNAME,
  DEFAULT_ORIGIN_ID,
} from '../constants';
import {
  readJson,
} from './read-json';

export interface OriginConfigSchema {
  origin?: Record<string, string>;
  origins?: Record<string, string>;
  selectedOriginId?: string;
}

export const readOriginConfig = (key?: string): any => {
  return readJson(ORIGIN_CONFIG_PATHNAME, key);
};

const writeOriginConfig = (key: string, value: any) => {
  const originConfig = readOriginConfig();
  fs.writeFileSync(ORIGIN_CONFIG_PATHNAME, JSON.stringify(_.set(originConfig, key, value)));
};

export const registerOrigin = (id: string, pathname: string) => {
  writeOriginConfig(`origins.${id}`, pathname);
};

export const deleteRegisteredOrigin = (id: string) => {
  const origins = readOriginConfig('origins');

  const newOrigins = Object.keys(origins).reduce((currentResult, currentOriginId) => {
    if (id !== currentOriginId) {
      return _.set(currentResult, currentOriginId, origins[currentOriginId]);
    }
    return currentResult;
  }, {});

  writeOriginConfig('origins', JSON.stringify(newOrigins));
};

export const switchSelectedOrigin = (newOriginId: string) => {
  if (!newOriginId) {
    return;
  }

  const internalOriginHandlerIdList = ['github', 'gitlab'];

  const origins = readOriginConfig('origins');

  if (newOriginId === DEFAULT_ORIGIN_ID) {
    writeOriginConfig('selectedOriginId', '');
    return;
  }

  if (internalOriginHandlerIdList.indexOf(newOriginId) === -1 && !origins[newOriginId]) {
    return;
  }

  writeOriginConfig('selectedOriginId', newOriginId);
};
