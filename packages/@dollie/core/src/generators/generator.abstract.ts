import {
  Origin,
} from '@dollie/origins';
import {
  BinaryTable,
  CacheTable,
  FileSystem,
  MergeTable,
  MessageHandler,
  TemplateConfig,
  TemplatePropsItem,
} from '../interfaces';
import { GlobMatcher } from '../matchers';

abstract class Generator {
  // name of template that to be used
  public templateName: string;
  // selected origin id
  public templateOrigin: string;
  // virtual file system instance
  protected volume: FileSystem;
  // template config, read from `dollie.js` or `dollie.json`
  protected templateConfig: TemplateConfig = {};
  // the table who stores all files
  // key is relative pathname, value is the diff changes
  protected cacheTable: CacheTable = {};
  protected mergeTable: MergeTable = {};
  // store binary pathname in virtual file system
  protected binaryTable: BinaryTable = {};
  // origins list
  protected origins: Origin[] = [];
  private templatePropsList: TemplatePropsItem[] = [];
  private pendingTemplateLabels: string[] = [];
  private targetedExtendTemplateIds: string[] = [];
  // glob pathname matcher
  private matcher: GlobMatcher;
  private messageHandler: MessageHandler;

  public abstract test();
}

export default Generator;
