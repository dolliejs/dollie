import {
  DollieOrigin,
} from '@dollie/origins';
import { Change } from 'diff';
import { Volume } from 'memfs';
import fs from 'fs';
import { Options as GotOptions } from 'got/dist/source';
import { Answers as InquirerAnswers, DistinctQuestion } from 'inquirer';

export type DollieQuestion<T extends InquirerAnswers = InquirerAnswers> = DistinctQuestion<T>;

export interface DiffChange extends Change {
  conflicted?: boolean;
  conflictGroup?: 'former' | 'current';
  lineNumber: number;
}

export interface LoaderOptions {
  httpProxyUrl?: string;
  httpProxyAuth?: string;
  maximumRetryCount?: number;
}

export type LoaderConfig = LoaderOptions & GotOptions;

export interface DollieConfig {
  origins?: DollieOrigin[];
  loader?: LoaderConfig;
}

export interface PatchTableItem {
  changes: Array<DiffChange>;
  modifyLength: number;
}
export type PatchTable = Record<string, PatchTableItem>;

export type MemFS = typeof Volume.prototype;
export type FileSystem = MemFS | typeof fs;

export interface ReadTemplateCallbackData {
  absolutePathname: string;
  relativePathname: string;
  entityName: string;
  isBinary: boolean;
}

export interface DollieTemplateFileConfig {
  merge?: Array<string>;
  add?: Array<string | Function>;
  delete?: Array<string | Function>;
}

export interface DollieTemplateConfig {
  questions?: {
    main?: DollieQuestion[];
    subTemplates?: Record<string, DollieQuestion[]>;
    modules?: Record<string, DollieQuestion[]>;
  };
  files?: DollieTemplateFileConfig;
}
