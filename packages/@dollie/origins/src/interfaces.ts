import {
  Got,
} from 'got';
import * as lodash from 'lodash';
import * as fs from 'fs';

export type OriginConfig = Record<string, any>;
export type OriginHeaders = Record<string, any>;
export type OriginMap = Record<string, string | OriginHandler>;

export interface OriginInfo {
  url: string;
  headers?: OriginHeaders;
  cache?: boolean;
}

export interface OriginHandlerDependencies {
  lodash: typeof lodash;
  fs: typeof fs;
}

export type OriginHandler = (
  id: string,
  config: OriginConfig,
  request: Got,
  deps: OriginHandlerDependencies,
) => Promise<OriginInfo>;

export interface Origin {
  name: string;
  handler: OriginHandler;
};
