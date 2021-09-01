import JSZip from 'jszip';
import fs from 'fs-extra';
import fileSystem from 'fs';
import path from 'path';
import { readEntities } from './entities';
import { FileContent } from './interfaces';

const readDirToZipBuffer = async (pathname: string): Promise<Buffer> => {
  if (!pathname || !fs.existsSync(pathname) || !fs.statSync(pathname).isDirectory()) {
    throw new Error('There is no files to read');
  }

  const gitIgnoreFilePathname = path.resolve(pathname, '.gitignore');
  let gitIgnoreFileContent = '';

  if (fs.existsSync(gitIgnoreFilePathname)) {
    gitIgnoreFileContent = fs.readFileSync(gitIgnoreFilePathname).toString();
  }

  const entities = readEntities(fileSystem, pathname, `.git\n${gitIgnoreFileContent}`);

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

    let fileContent: FileContent = fs.readFileSync(absoluteOriginalPathname) as Buffer;

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
