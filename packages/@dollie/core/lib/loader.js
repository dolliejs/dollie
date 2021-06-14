const got = require('got');
const _ = require('lodash');
const path = require('path');
const decompress = require('decompress');
const { HTTPNotFoundError, HTTPTimeoutError } = require('./errors');
const Url = require('url');
const tunnel = require('tunnel');
const fs = require('fs');
const {
  VIRTUAL_VOLUME_DESTINATION_PATHNAME,
} = require('./constants');

const downloadCompressedFile = async function(
  url,
  fileSystem,
  options = {},
) {
  const startTimestamp = Date.now();

  return new Promise((resolve, reject) => {
    fileSystem.mkdirpSync(VIRTUAL_VOLUME_DESTINATION_PATHNAME);

    const getAbsolutePath = (filePath) => {
      const relativePathname = filePath.split('/').slice(1).join('/');
      return path.resolve(VIRTUAL_VOLUME_DESTINATION_PATHNAME, relativePathname);
    };

    const downloaderOptions = _.merge(options || {}, { isStream: true });

    const downloader = got.stream(
      url,
      downloaderOptions,
    );

    const fileBufferChunks = [];

    downloader.on('error', (error) => {
      const errorMessage = error.toString();
      if (errorMessage.indexOf('404') !== -1) {
        reject(new HTTPNotFoundError());
      }
      if (error.code === 'ETIMEDOUT') {
        reject(new HTTPTimeoutError(downloaderOptions.timeout));
      }
      const otherError = new Error(errorMessage);
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
            fileSystem.mkdirpSync(getAbsolutePath(filePath));
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
  url,
  fileSystem = fs,
  options = {},
) => {
  const traverse = async function(
    url,
    fileSystem = fs,
    retries = 0,
    options = {},
  ) {
    const {
      httpProxyUrl = '',
      httpProxyAuth = '',
      maximumRetryCount = 3,
      ...originalOptions
    } = options;
    const gotOptions = _.clone(originalOptions);
    if (httpProxyUrl) {
      const { hostname: host, port } = Url.parse(httpProxyUrl);
      const proxy = {
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
      if (error.code === 'E_SCAFFOLD_TIMEOUT' || error instanceof HTTPTimeoutError) {
        if (retries < maximumRetryCount) {
          return await traverse(
            url,
            fileSystem,
            retries + 1,
            options,
          );
        } else {
          throw new Error(error?.message || 'download scaffold timed out');
        }
      } else {
        throw error;
      }
    }
  };
  return await traverse(url, fileSystem, 0, options);
};

module.exports = {
  downloadCompressedFile,
  loadTemplate,
};
