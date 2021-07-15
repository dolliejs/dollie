import {
  Got,
} from 'got';
import * as lodash from 'lodash';
import * as fs from 'fs';

export type DollieOriginConfig = Record<string, any>;
export type DollieOriginHeaders = Record<string, any>;
export type DollieOriginMap = Record<string, string | DollieOriginHandler>;

export interface DollieOriginInfo {
  url: string;
  headers?: DollieOriginHeaders;
  cache?: boolean;
}

export interface OriginHandlerDependencies {
  lodash: typeof lodash;
  fs: typeof fs;
}

export type DollieOriginHandler = (
  id: string,
  config: DollieOriginConfig,
  request: Got,
  deps: OriginHandlerDependencies,
) => Promise<DollieOriginInfo>;

export interface DollieOrigin {
  name: string;
  handler: DollieOriginHandler;
};
