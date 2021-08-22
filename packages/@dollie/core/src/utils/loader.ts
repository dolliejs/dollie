import {
  Options as GotOptions,
} from 'got';
import _ from 'lodash';
import path from 'path';
import {
  HTTPError,
} from '../errors';
import fs from 'fs';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX, TEMPLATE_FILE_PREFIX,
} from '../constants';
import {
  FileSystem,
  LoaderConfig,
  TemplateEntity,
} from '../interfaces';
import {
  isBinaryFileSync,
} from 'isbinaryfile';
import {
  createHttpInstance,
} from './http';

/**
 * download file from remote origin
 * @param {string} url
 * @param {GotOptions} options
 * @returns {Promise<Buffer>}
 */
const downloadFile = async (
  url: string,
  options: GotOptions = {},
): Promise<Buffer> => {
  const response = await createHttpInstance(options || {}).get(url);
  return response.rawBody;
};

/**
 * download template from origin
 * @param {string} url
 * @param {GotOptions} options
 * @returns {void}
 */
const loadRemoteTemplate = async (
  url: string,
  options: LoaderConfig = {},
) => {
  const download = async function(
    url: string,
    retries = 0,
    options: LoaderConfig = {},
  ) {
    const {
      maximumRetryCount = 3,
      ...originalOptions
    } = options;

    try {
      const result = await downloadFile(url, originalOptions);
      return result;
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        if (retries < maximumRetryCount) {
          return await download(url, retries + 1, options);
        } else {
          throw new HTTPError(error.code, error.statusCode, error?.message || 'Download template timed out');
        }
      } else {
        throw error;
      }
    }
  };

  return (await download(url, 0, options)) as Buffer;
};

/**
 * read template directory tree and flatten them to an array
 * @param {FileSystem} fileSystem
 * @param {string} pathname
 * @returns {TemplateEntity[]}
 */
const readTemplateEntities = (
  fileSystem: FileSystem = fs,
  pathname = TEMPLATE_CACHE_PATHNAME_PREFIX,
) => {
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

      if (entityName.startsWith(TEMPLATE_FILE_PREFIX)) {
        isTemplateFile = true;
        entityName = entityName.slice(TEMPLATE_FILE_PREFIX.length);
        relativePathname = `${relativeDirectoryPathname ? `${relativeDirectoryPathname}/` : ''}${entityName}`;
        absolutePathname = `${absoluteDirectoryPathname ? `${absoluteDirectoryPathname}/` : ''}${entityName}`;
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
  loadRemoteTemplate,
  readTemplateEntities,
};
