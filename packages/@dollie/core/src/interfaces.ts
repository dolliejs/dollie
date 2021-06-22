import {
  DollieOrigin,
} from '@dollie/origins';
import { Change } from 'diff';
import { Volume } from 'memfs';
import fs from 'fs';
import { Options as GotOptions } from 'got/dist/source';
import { Answers as DollieAnswers, DistinctQuestion } from 'inquirer';

export type DollieQuestion<T extends DollieAnswers = DollieAnswers> = DistinctQuestion<T>;

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
  getTemplateProps?: (questions: DollieQuestion[]) => Promise<DollieAnswers>;
  conflictsSolver?: (data: ConflictSolverData) => MergeBlock | 'ignored' | null;
}

export interface PatchTableItem {
  changes: DiffChange[];
  modifyLength: number;
}
export type PatchTable = Record<string, PatchTableItem>;

export type MemFS = typeof Volume.prototype;
export type FileSystem = MemFS | typeof fs;

export interface TemplateEntity {
  absolutePathname: string;
  relativePathname: string;
  entityName: string;
  isBinary: boolean;
  isDirectory: boolean;
  relativeDirectoryPathname: string;
}

export type DeleteConfigHandler = (
  templateConfig: DollieTemplateConfig,
  targets: string[],
) => string | string[];

export interface DollieTemplateFileConfig {
  merge?: string[];
  delete?: (string | DeleteConfigHandler)[];
}

export interface DollieTemplateCleanupData {
  addFile: (pathname: string, content: string) => void;
  deleteFiles: (pathnameList: string[]) => void;
}

export type DollieTemplateCleanUpFunction = (data: DollieTemplateCleanupData) => MergeTable;
export type DollieExtendTemplateConfig = Record<string, Omit<DollieTemplateConfig, 'extendTemplates'>>;

export interface DollieTemplateConfig {
  questions?: DollieQuestion[];
  files?: DollieTemplateFileConfig;
  cleanups?: DollieTemplateCleanUpFunction[];
  extendTemplates?: DollieExtendTemplateConfig;
}

export interface ParsedProps {
  props: Record<string, any>;
  pendingExtendTemplateLabels: string[];
}

export interface TemplatePropsItem {
  label: string;
  props: DollieAnswers;
}

export interface MergeBlock {
  status: 'OK' | 'CONFLICT';
  values: {
    former: string[],
    current: string[],
  };
  ignored?: boolean;
}

export type CacheTable = Record<string, DiffChange[][]>;
export type MergeTable = Record<string, MergeBlock[]>;
export type BinaryTable = Record<string, Buffer>;

export interface ConflictItem {
  pathname: string;
  blocks: MergeBlock[];
}

export interface ConflictBlockMetadata {
  pathname: string;
  index: number;
}

export interface ConflictSolverData extends ConflictBlockMetadata {
  block: MergeBlock;
  content: string;
}

export interface DollieGeneratorResult {
  files: Record<string, string | Buffer>;
  conflicts: string[];
}
