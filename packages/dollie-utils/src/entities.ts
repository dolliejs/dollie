import fs from 'fs';
import path from 'path';
import {
  FileSystem,
  TemplateEntity,
} from './interfaces';
import {
  isBinaryFileSync,
} from 'isbinaryfile';
import gitIgnoreParser from 'gitignore-parser';
import _ from 'lodash';

/**
 * read template directory tree and flatten them to an array
 * @param {FileSystem} fileSystem
 * @param {string} pathname
 * @returns {TemplateEntity[]}
 */
const readEntities = (
  fileSystem: FileSystem = fs,
  pathname = '',
  gitIgnoreFileContent?: string,
) => {
  let rule: ReturnType<typeof gitIgnoreParser.compile>;

  if (gitIgnoreFileContent && _.isString(gitIgnoreFileContent)) {
    rule = gitIgnoreParser.compile(`${gitIgnoreFileContent}\n.git`);
  }

  /**
   * traverse from template root dir
   * @param {FileSystem} fileSystem
   * @param {string} currentEntityPathname
   * @param {TemplateEntity[]} result
   * @returns {TemplateEntity[]}
   */
  const traverse = (
    fileSystem: FileSystem = fs,
    currentEntityPathname: string,
    result: TemplateEntity[] = [],
  ) => {
    let currentResult = Array.from(result);

    if (fileSystem.existsSync(currentEntityPathname)) {
      const stat = fileSystem.statSync(currentEntityPathname);
      const fileContent = stat.isFile()
        ? fileSystem.readFileSync(currentEntityPathname)
        : null;

      let relativePathname = path.relative(pathname, currentEntityPathname);
      let absolutePathname = currentEntityPathname;
      const relativeOriginalPathname = relativePathname;
      const absoluteOriginalPathname = currentEntityPathname;

      const relativeDirectoryPathname = relativePathname
        .split(path.sep)
        .slice(0, -1)
        .join(path.sep);
      const absoluteDirectoryPathname = currentEntityPathname
        .split(path.sep)
        .slice(0, -1)
        .join(path.sep);

      let entityName = currentEntityPathname.split('/').pop();
      let isTemplateFile = false;

      if (rule?.denies(relativeOriginalPathname) || rule?.denies(relativePathname)) {
        return currentResult;
      }

      currentResult.push({
        entityName,
        isTemplateFile,
        absoluteOriginalPathname,
        absolutePathname,
        relativeOriginalPathname,
        relativePathname,
        absoluteDirectoryPathname,
        relativeDirectoryPathname,
        isBinary: (stat.isFile() && fileContent)
          ? isBinaryFileSync(fileContent, fileContent.length)
          : false,
        isDirectory: stat.isDirectory(),
      });

      if (stat.isDirectory()) {
        const entities = fileSystem.readdirSync(currentEntityPathname);
        for (const entity of entities) {
          currentResult = traverse(
            fileSystem,
            `${currentEntityPathname}/${entity}`,
            currentResult,
          );
        }
      }
    }

    return currentResult;
  };

  return traverse(fileSystem, pathname);
};

export {
  readEntities,
};
