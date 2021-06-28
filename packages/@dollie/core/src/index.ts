import Context from './context';

export {
  Context,
};

export {
  DollieConfig,
  ConflictSolveResult,
  MergeBlock,
  ConflictSolverData,
} from './interfaces';

export {
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
} from './diff';
