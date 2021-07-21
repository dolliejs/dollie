import {
  Got,
} from 'got';
import * as lodash from 'lodash';
import * as fs from 'fs';

export type OriginConfig = Record<string, any>;
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
  config: OriginConfig,
  request: Got,
  deps: OriginHandlerDependencies,
) => Promise<DollieOriginInfo>;

export interface Origin {
  name: string;
  handler: DollieOriginHandler;
};
