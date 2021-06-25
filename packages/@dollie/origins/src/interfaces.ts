export type DollieOriginConfig = Record<string, any>;
export type DollieOriginHeaders = Record<string, any>;

export interface DollieOriginInfo {
  url: string;
  headers?: DollieOriginHeaders;
}

export type DollieOriginHandler = (
  id: string,
  config: DollieOriginConfig,
) => Promise<DollieOriginInfo>;

export interface DollieOrigin {
  name: string;
  handler: DollieOriginHandler;
};
