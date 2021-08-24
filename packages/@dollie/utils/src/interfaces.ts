import {
  Volume,
} from 'memfs';
import fs from 'fs';

export type MemFS = typeof Volume.prototype;
export type FileSystem = MemFS | typeof fs;

export interface TemplateEntity {
  absoluteOriginalPathname: string;
  absolutePathname: string;
  relativeOriginalPathname: string;
  relativePathname: string;
  entityName: string;
  isTemplateFile: boolean;
  isBinary: boolean;
  isDirectory: boolean;
  relativeDirectoryPathname: string;
  absoluteDirectoryPathname: string;
}
