import got, { Options as GotOptions, RequestError } from 'got';
import _ from 'lodash';
import path from 'path';
import decompress from 'decompress';
import {
  DollieError,
  HTTPNotFoundError,
  HTTPTimeoutError,
} from './errors';
import Url from 'url';
import tunnel from 'tunnel';
import fs from 'fs';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX,
} from './constants';
import { FileSystem, LoaderConfig, TemplateEntity } from './interfaces';
import { isBinaryFileSync } from 'isbinaryfile';

const downloadCompressedFile = async (
  url: string,
  fileSystem: FileSystem,
  options: GotOptions = {},
) => {
  const startTimestamp = Date.now();

  return new Promise((resolve, reject) => {
    fileSystem.mkdirSync(TEMPLATE_CACHE_PATHNAME_PREFIX, { recursive: true });

    const getAbsolutePath = (filePath) => {
      const relativePathname = filePath.split('/').slice(1).join('/');
      return path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, relativePathname);
    };

    const downloaderOptions = _.merge(options || {}, { isStream: true });

    const downloader = got.stream(
      url,
      downloaderOptions as GotOptions & { isStream: true },
    );

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
      const fileBuffer = Buffer.concat(fileBufferChunks);

      decompress(fileBuffer).then((files) => {
        for (const file of files) {
          const { type, path: filePath, data } = file;
          if (type === 'directory') {
            fileSystem.mkdirSync(getAbsolutePath(filePath), { recursive: true });
          } else if (type === 'file') {
            fileSystem.writeFileSync(getAbsolutePath(filePath), data, { encoding: 'utf8' });
          }
        }
        return;
      }).then(() => {
        resolve(Date.now() - startTimestamp);
      });
    });
  });
};

const loadTemplate = async (
  url: string,
  fileSystem: FileSystem = fs,
  options: LoaderConfig = {},
) => {
  const traverse = async function(
    url: string,
    fileSystem: FileSystem = fs,
    retries = 0,
    options: LoaderConfig = {},
  ) {
    const {
      httpProxyUrl = '',
      httpProxyAuth = '',
      maximumRetryCount = 3,
      ...originalOptions
    } = options;
    const gotOptions = _.clone(originalOptions) as GotOptions;
    if (httpProxyUrl) {
      const { hostname: host, port } = Url.parse(httpProxyUrl);
      const proxy: tunnel.ProxyOptions = {
        host,
        port: parseInt(port, 10),
      };
      if (httpProxyAuth) { proxy.proxyAuth = httpProxyAuth; }
      gotOptions.agent = {
        http: tunnel.httpOverHttp({ proxy }),
        https: tunnel.httpsOverHttp({ proxy }),
      };
    }
    try {
      return await downloadCompressedFile(
        url,
        fileSystem,
        gotOptions,
      );
    } catch (error) {
      if (error.code === 'E_TEMPLATE_TIMEOUT' || error instanceof HTTPTimeoutError) {
        if (retries < maximumRetryCount) {
          return await traverse(
            url,
            fileSystem,
            retries + 1,
            options,
          );
        } else {
          throw new Error(error?.message || 'download template timed out');
        }
      } else {
        throw error;
      }
    }
  };
  return await traverse(url, fileSystem, 0, options);
};

const readTemplateEntities = (
  fileSystem: FileSystem = fs,
  pathname = TEMPLATE_CACHE_PATHNAME_PREFIX,
) => {
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
        relativeDirectoryPathname: relativePathname.split(path.sep).slice(0, -1).join(path.sep),
      });

      if (stat.isDirectory()) {
        const entities = fileSystem.readdirSync(currentEntityPathname);
        for (const entity of entities) {
          currentResult = traverse(fileSystem, `${currentEntityPathname}/${entity}`, currentResult);
        }
      }
    }

    return currentResult;
  };

  return traverse(fileSystem, pathname);
};

export {
  downloadCompressedFile,
  loadTemplate,
  readTemplateEntities,
};
