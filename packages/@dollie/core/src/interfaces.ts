import {
  DollieOrigin,
} from '@dollie/origins';
import { Change } from 'diff';
import { Volume } from 'memfs';
import fs from 'fs';
import { Options as GotOptions } from 'got/dist/source';

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
  getScaffoldConfig?: () => void;
}

export interface PatchTableItem {
  changes: Array<DiffChange>;
  modifyLength: number;
}
export type PatchTable = Record<string, PatchTableItem>;

export type MemFS = typeof Volume.prototype;
export type FileSystem = MemFS | typeof fs;
