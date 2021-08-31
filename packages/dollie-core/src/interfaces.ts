import {
  OriginHandler,
  OriginConfig,
} from '@dollie/origins';
import {
  Change,
} from 'diff';
import {
  Options as GotOptions,
} from 'got';
import {
  Answers as InquirerAnswers,
  DistinctQuestion,
} from 'inquirer';
import {
  ContextError,
  HTTPError,
} from './errors';
import {
  GeneralHandlerContext,
  TemplateEntity,
  FileContent,
} from '@dollie/utils';

export type ErrorHandler = (error: ContextError | HTTPError) => void;

export type Question<T extends InquirerAnswers = InquirerAnswers> = DistinctQuestion<T>;

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

export interface BaseGeneratorConfig {
  loader?: LoaderConfig;
  origin?: OriginConfig;
  getTemplateProps?: (questions: Question[]) => Promise<InquirerAnswers>;
  originHandler?: OriginHandler;
  setCache?: SetCacheHandler;
  getCache?: GetCacheHandler;
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
}

export interface ProjectGeneratorConfig extends BaseGeneratorConfig {
  // configuration items for selected origin handler
  conflictsSolver?: (data: ConflictSolverData) => Promise<ConflictSolveResult>;
}

export type ModuleGeneratorConfig = BaseGeneratorConfig;

export interface PatchTableItem {
  changes: DiffChange[];
  modifyLength: number;
}
export type PatchTable = Record<string, PatchTableItem>;

export type DeleteConfigHandler = (
  templateConfig: TemplateConfig,
  targets: string[],
) => Promise<string | string[]>;

export interface TemplateFileConfig {
  merge?: string[];
  delete?: (string | DeleteConfigHandler)[];
}

export interface TemplateCleanupData {
  addFile: (pathname: string, content: string) => void;
  addTextFile: (pathname: string, content: string) => void;
  addBinaryFile: (pathname: string, content: Buffer) => void;
  deleteFiles: (pathnameList: string[]) => void;
  exists: (pathname: string) => void;
  getTextFileContent: (pathname: string) => string;
  getBinaryFileBuffer: (pathname: string) => Buffer;
}

export type TemplateCleanUpFunction = (data: TemplateCleanupData) => MergeTable;
export type ExtendTemplateConfig = Record<string, Omit<TemplateConfig, 'extendTemplates'>>;

export type ModuleEntityAlias = Record<string, string>;
export type EntityExistenceChecker = (pathname: string) => Promise<boolean>;
export type EntityReader = (pathname: string) => Promise<TemplateFileItem>;

export interface ModuleConfigHandlerContext {
  moduleId: string;
  props: InquirerAnswers;
  context: GeneralHandlerContext;
  exists: EntityExistenceChecker;
  getEntity: EntityReader;
}

export type ModuleDeleteConfigHandler = (data: ModuleConfigHandlerContext) => Promise<string | string[]>;

export interface ModuleTemplateConfig {
  questions?: Question[];
  alias?: ModuleEntityAlias;
  files?: {
    delete?: (string | ModuleDeleteConfigHandler)[];
  };
  validate?: (context: ModuleConfigHandlerContext) => Promise<boolean>;
}

export interface TemplateConfig {
  questions?: Question[];
  files?: TemplateFileConfig;
  cleanups?: TemplateCleanUpFunction[];
  extendTemplates?: ExtendTemplateConfig;
  modules?: Record<string, ModuleTemplateConfig>;
}

export interface ParsedProps {
  props: Record<string, any>;
  pendingExtendTemplateLabels: string[];
}

export interface TemplatePropsItem {
  label: string;
  props: InquirerAnswers;
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

export type FileTable = Record<string, FileContent>;

export interface GeneratorResult {
  files: FileTable;
  conflicts: string[];
}

export type ContextStatus = 'pending' | 'running' | 'finished';
export interface ContextStatusMap {
  [key: string]: ContextStatus;
}

export type StatusChangeHandler = (status: ContextStatusMap) => void;
export type MessageHandler = (message: string) => void;
export type SetCacheHandler = (label: string, data: Buffer) => void;
export type GetCacheHandler = (label: string) => Promise<Buffer>;

export type ContextType = 'project' | 'module';

export type ProjectContextConfig = ProjectGeneratorConfig;
export interface ModuleContextConfig extends ModuleGeneratorConfig {
  files?: TemplateFileItem[];
  moduleId?: string;
}

export interface Config {
  type?: ContextType;
  generator?: ProjectContextConfig | ModuleContextConfig;
  onStatusChange?: StatusChangeHandler;
  onMessage?: MessageHandler;
}

export interface TemplateFileItem extends TemplateEntity {
  content?: FileContent;
}
