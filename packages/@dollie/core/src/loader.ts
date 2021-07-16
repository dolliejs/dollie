import {
  Options as GotOptions,
  RequestError,
} from 'got';
import _ from 'lodash';
import path from 'path';
import decompress from 'decompress';
import {
  DollieError,
  HTTPNotFoundError,
  HTTPTimeoutError,
} from './errors';
import fs from 'fs';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX,
} from './constants';
import {
  FileSystem,
  LoaderConfig,
  TemplateEntity,
} from './interfaces';
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
  return new Promise((resolve, reject) => {
    const downloader = createHttpInstance(_.merge(
      options || {}, {
        isStream: true,
      },
    )).stream(url);

    const fileBufferChunks = [];

    downloader.on('error', (error: RequestError) => {
      const errorMessage = error.toString();
      if (errorMessage.indexOf('404') !== -1) {
        reject(new HTTPNotFoundError());
      }
      if (error.code === 'ETIMEDOUT') {
        reject(new HTTPTimeoutError());
      }
      const otherError = new DollieError(errorMessage);
      otherError.code = error.code || 'E_UNKNOWN';
      reject(new Error(errorMessage));
    });

    downloader.on('data', (chunk) => {
      fileBufferChunks.push(chunk);
    });

    downloader.on('end', () => {
      // concat all buffer chunks to one buffer
      const fileBuffer = Buffer.concat(fileBufferChunks);
      resolve(fileBuffer);
    });
  });
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
      return await downloadFile(url, originalOptions);
    } catch (error) {
      if (error.code === 'E_TEMPLATE_TIMEOUT' || error instanceof HTTPTimeoutError) {
        if (retries < maximumRetryCount) {
          return await download(url, retries + 1, options);
        } else {
          throw new Error(error?.message || 'download template timed out');
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
      const relativePathname = path.relative(pathname, currentEntityPathname);

      currentResult.push({
        absolutePathname: currentEntityPathname,
        relativePathname,
        entityName: currentEntityPathname.split('/').pop(),
        isBinary: (stat.isFile() && fileContent)
          ? isBinaryFileSync(fileContent, fileContent.length)
          : false,
        isDirectory: stat.isDirectory(),
        relativeDirectoryPathname: relativePathname
          .split(path.sep)
          .slice(0, -1)
          .join(path.sep),
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
