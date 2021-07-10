import {
    DollieOrigin,
    DollieOriginConfig,
} from '@dollie/origins';
import { Change } from 'diff';
import { Volume } from 'memfs';
import fs from 'fs';
import { Options as GotOptions } from 'got/dist/source';
import { Answers as DollieAnswers, DistinctQuestion } from 'inquirer';
import { DollieError } from './errors';

export type DollieQuestion<T extends DollieAnswers = DollieAnswers> = DistinctQuestion<T>;

export interface DiffChange extends Change {
    conflicted?: boolean;
    conflictGroup?: 'former' | 'current';
    lineNumber: number;
}

export interface HttpOptions {
    httpProxyUrl?: string;
    httpProxyAuth?: string;
}

export type RequestOptions = HttpOptions & GotOptions;

export interface LoaderOptions extends HttpOptions {
    maximumRetryCount?: number;
}

export type LoaderConfig = LoaderOptions & GotOptions;

export type ConflictSolveResult = MergeBlock | 'ignored' | null;

export interface DollieGeneratorConfig {
    origin?: DollieOriginConfig;
    origins?: DollieOrigin[];
    loader?: LoaderConfig;
    getTemplateProps?: (questions: DollieQuestion[]) => Promise<DollieAnswers>;
    conflictsSolver?: (data: ConflictSolverData) => Promise<ConflictSolveResult>;
    onMessage?: MessageHandler;
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
) => Promise<string | string[]>;

export interface DollieTemplateFileConfig {
    merge?: string[];
    delete?: (string | DeleteConfigHandler)[];
}

export interface DollieTemplateCleanupData {
    addFile: (pathname: string, content: string) => void;
    addTextFile: (pathname: string, content: string) => void;
    addBinaryFile: (pathname: string, content: Buffer) => void;
    deleteFiles: (pathnameList: string[]) => void;
    exists: (pathname: string) => void;
    getTextFileContent: (pathname: string) => string;
    getBinaryFileBuffer: (pathname: string) => Buffer;
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
    total: number;
}

export interface DollieGeneratorResult {
    files: Record<string, string | Buffer>;
    conflicts: string[];
}

export type DollieContextStatus = 'pending' | 'running' | 'finished';
export interface DollieContextStatusMap {
    [key: string]: DollieContextStatus;
}

export type StatusChangeHandler = (status: DollieContextStatusMap) => void;
export type ErrorHandler = (error: DollieError) => void;
export type MessageHandler = (message: string) => void;

export interface DollieConfig {
    generator?: DollieGeneratorConfig;
    onStatusChange?: StatusChangeHandler;
    onError?: ErrorHandler;
    onMessage?: MessageHandler;
}
