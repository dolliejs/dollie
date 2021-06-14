const got = require('got');
const _ = require('lodash');
const path = require('path');
const decompress = require('decompress');
const { HTTPNotFoundError, HTTPTimeoutError } = require('./errors');

const downloadCompressedFile = async function(
  url,
  fileSystem,
  destination,
  options = {},
) {
  const startTimestamp = Date.now();
  return new Promise((resolve, reject) => {
    fileSystem.mkdirpSync(destination);

    const getAbsolutePath = (filePath) => {
      const relativePathname = filePath.split('/').slice(1).join('/');
      return path.resolve(destination, relativePathname);
    };

    const downloaderOptions = _.merge({ timeout: 90000 }, options || {}, { isStream: true });

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

module.exports = {
  downloadCompressedFile,
};
