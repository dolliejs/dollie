import { Change } from 'diff';

declare type Pathname = string;
declare type TemplateFileType = 'text' | 'binary';
declare type TemplateFileContentMap = Record<Pathname, TemplateFileContentMapItem>;

declare interface TextFileChange extends Change {
  conflicted?: boolean;
  conflictType?: 'former' | 'current';
  lineNumber: number;
}

declare interface TemplateFileContentMapItem {
  type: TemplateFileType;
  contentStack?: Array<Array<TextFileChange>>;
  binaryFileBuffer?: Buffer;
}

declare abstract class Context {
  constructor(parameters) {}

  private templateFileContentMap: TemplateFileContentMap;
}

export default {
  Context,
}
