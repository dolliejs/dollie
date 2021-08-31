import Context from './context';
import {
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
} from './diff';

export {
  Context,
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
};

export {
  Config,
  ConflictSolveResult,
  MergeBlock,
  ConflictSolverData,
  LoaderConfig,
  ModuleContextConfig,
  TemplateFileItem,
} from './interfaces';

export default {
  Context,
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
};
