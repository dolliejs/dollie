export type DollieOriginConfig = Record<string, any>;
export type DollieOriginHeaders = Record<string, any>;

export interface DollieOriginMetadata {
  configPaths: string[];
  getTemplateUrl: (name: string, config: DollieOriginConfig) => Promise<string>;
  getHeaders?: (name: string, config: DollieOriginConfig) => Promise<DollieOriginHeaders>;
}

export interface DollieOriginInfo {
  url: string;
  headers?: DollieOriginHeaders;
}

export interface DollieOrigin {
  name: string;
  handler: (templateName: string, config: DollieOriginConfig) => Promise<DollieOriginInfo>;
}
