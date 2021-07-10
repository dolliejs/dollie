import { Got } from 'got';

export type DollieOriginConfig = Record<string, any>;
export type DollieOriginHeaders = Record<string, any>;
export type DollieOriginMap = Record<string, string | DollieOriginHandler>;

export interface DollieOriginInfo {
    url: string;
    headers?: DollieOriginHeaders;
}

export type DollieOriginHandler = (
    id: string,
    config: DollieOriginConfig,
    request: Got,
) => Promise<DollieOriginInfo>;

export interface DollieOrigin {
    name: string;
    handler: DollieOriginHandler;
};
