import { diffLines } from 'diff';
import _ from 'lodash';
import { DiffChange, PatchTable } from './interfaces';

const diff = (originalContent: string, currentContent: string): DiffChange[] => {
  const changes = diffLines(originalContent, currentContent || originalContent);
  const result: DiffChange[] = [];
  let lineNumber = 0;

  const splitChanges = changes.reduce((result, currentItem) => {
    const lines = (currentItem.value.endsWith('\n')
      ? currentItem.value.slice(0, -1)
      : currentItem.value
    ).split('\n').map((item) => _.omit({ ...currentItem, value: `${item}\n` }, 'count'));
    return result.concat(lines);
  }, []);

  while (splitChanges.length !== 0) {
    const currentSplitChange = splitChanges.shift();
    if (!currentSplitChange.added) {
      result.push({ ...currentSplitChange, lineNumber: lineNumber++ });
    } else {
      result.push({ ...currentSplitChange, lineNumber: lineNumber - 1 });
    }
  }

  return result;
};

const merge = (originalChanges: DiffChange[], diffList: DiffChange[][]): DiffChange[] => {
  if (!originalChanges) {
    return [];
  }

  if (!diffList || !Array.isArray(diffList) || diffList.length === 0) {
    return originalChanges;
  }

  const originalDiff = Array.from(originalChanges);
  const patchTable: PatchTable = {};

  for (const currentDiff of diffList) {
    for (const change of currentDiff) {
      if (change.added) {
        if (!patchTable[change.lineNumber]) {
          patchTable[change.lineNumber] = {
            changes: [],
            modifyLength: 0,
          };
        }
        patchTable[change.lineNumber].changes.push(change);
      } else {
        if (change.removed) {
          originalDiff.splice(change.lineNumber, 1, change);
        }
      }
    }
    const addedChangeLineNumbers = currentDiff
      .filter((change) => change.added)
      .map((change) => change.lineNumber);

    for (const matchedLineNumber of _.uniq(addedChangeLineNumbers)) {
      patchTable[matchedLineNumber].modifyLength += 1;
    }
  }

  for (const patchIndex of Object.keys(patchTable)) {
    const currentPatchItem = patchTable[patchIndex];
    if (currentPatchItem.modifyLength > 1) {
      currentPatchItem.changes = currentPatchItem.changes.map((change) => ({
        ...change,
        conflicted: true,
        conflictGroup: 'current',
      }));
    }
  }

  const blocks: Array<Array<DiffChange>> = [];
  const patches = Object.keys(patchTable).map(
    (patchIndex) => patchTable[patchIndex],
  );

  const lineNumbers = Object.keys(patchTable).map((lineNumber) => {
    return parseInt(lineNumber, 10);
  });

  lineNumbers.unshift(-1);

  for (const [index, lineNumber] of lineNumbers.entries()) {
    const nextLineNumber = lineNumbers[index + 1];
    if (nextLineNumber === undefined) {
      blocks.push(originalDiff.slice(lineNumber + 1));
    } else {
      blocks.push(originalDiff.slice(lineNumber + 1, nextLineNumber + 1));
    }
  }

  return blocks.reduce((result, currentBlock) => {
    const currentPatchItem = patches.shift();
    if (!currentPatchItem) {
      return result.concat(currentBlock);
    }
    return result.concat(currentBlock).concat(currentPatchItem.changes);
  }, []);
};

export {
  diff,
  merge,
};
