import {
  GeneralHandlerContext,
} from '@dollie/utils';

export type OriginConfig = Record<string, any>;
export type OriginHeaders = Record<string, any>;
export type OriginMap = Record<string, string | OriginHandler>;

export interface OriginInfo {
  url: string;
  headers?: OriginHeaders;
  cache?: boolean;
}

export type OriginHandler = (
  id: string,
  config: OriginConfig,
  context: GeneralHandlerContext,
) => Promise<OriginInfo>;

export interface Origin {
  name: string;
  handler: OriginHandler;
};
