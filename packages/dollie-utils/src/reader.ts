import JSZip from 'jszip';
import fs from 'fs-extra';
import fileSystem from 'fs';
import { readEntities } from './entities';

const readDirToZipBuffer = async (pathname: string): Promise<Buffer> => {
  if (!pathname || !fs.existsSync(pathname) || !fs.statSync(pathname).isDirectory()) {
    throw new Error('There is no files to read');
  }

  const entities = readEntities(fileSystem, pathname);

  const zipFile = new JSZip();

  for (const entity of entities) {
    const {
      absoluteOriginalPathname,
      relativeOriginalPathname,
      isDirectory,
      isBinary,
    } = entity;

    if (isDirectory) {
      continue;
    }

    let fileContent: string | Buffer = fs.readFileSync(absoluteOriginalPathname) as Buffer;

    if (!isBinary) {
      fileContent = fileContent.toString();
    }

    zipFile.file(relativeOriginalPathname, fileContent, {
      binary: isBinary,
    });
  }

  return await zipFile.generateAsync({ type: 'nodebuffer' });
};

export {
  readDirToZipBuffer,
};
