import fs from 'fs-extra';
import _ from 'lodash';
import {
  ORIGIN_CONFIG_PATHNAME,
} from '../constants';

export interface OriginConfigSchema {
  origin?: Record<string, string>;
  origins?: Record<string, string>;
  selectedOriginId?: string;
}

export const readOriginConfig = (key?: string): OriginConfigSchema => {
  const content = fs.readFileSync(ORIGIN_CONFIG_PATHNAME).toString() || '{}';
  let config: OriginConfigSchema;

  try {
    config = JSON.parse(content) as OriginConfigSchema;
  } catch {
    config = {};
  }

  return (
    key && _.isString(key)
      ? config[key]
      : config
  );
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
  const origins = readOriginConfig('origins');

  if (!origins[newOriginId]) {
    return;
  }

  writeOriginConfig('selectedOriginId', newOriginId);
};
