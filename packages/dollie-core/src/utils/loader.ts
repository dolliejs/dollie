import {
  Options as GotOptions,
} from 'got';
import _ from 'lodash';
import {
  HTTPError,
} from '../errors';
import fs from 'fs';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_FILE_PREFIX,
} from '../constants';
import {
  LoaderConfig,
} from '../interfaces';
import {
  createHttpInstance,
} from './http';
import {
  FileSystem,
  readEntities,
} from '@dollie/utils';

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
  const entities = readEntities(fileSystem, pathname).map((entity) => {
    const {
      relativeDirectoryPathname,
      absoluteDirectoryPathname,
      entityName: initialEntityName,
      relativePathname: initialRelativePathname,
      absolutePathname: initialAbsolutePathname,
    } = entity;

    let isTemplateFile = false;
    let entityName = initialEntityName;
    let relativePathname = initialRelativePathname;
    let absolutePathname = initialAbsolutePathname;

    if (initialEntityName.startsWith(TEMPLATE_FILE_PREFIX)) {
      isTemplateFile = true;
      entityName = initialEntityName.slice(TEMPLATE_FILE_PREFIX.length);
      relativePathname = `${relativeDirectoryPathname ? `${relativeDirectoryPathname}/` : ''}${entityName}`;
      absolutePathname = `${absoluteDirectoryPathname ? `${absoluteDirectoryPathname}/` : ''}${entityName}`;
    }

    return {
      ...entity,
      isTemplateFile,
      relativePathname,
      absolutePathname,
    };
  });

  return entities;
};

export {
  loadRemoteTemplate,
  readTemplateEntities,
};
