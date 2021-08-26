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
} from './interfaces';

export default {
  Context,
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
};
