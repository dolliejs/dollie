import {
  BinaryTable,
  CacheTable,
  ConflictBlockMetadata,
  ConflictItem,
  DollieConfig,
  DollieGeneratorResult,
  DollieTemplateCleanUpFunction,
  DollieTemplateConfig,
  FileSystem,
  MergeTable,
  TemplatePropsItem,
} from './interfaces';
import _ from 'lodash';
import {
  InvalidInputError,
  ContextError,
} from './errors';
import {
  DollieOrigin,
  githubOrigin,
  gitlabOrigin,
} from '@dollie/origins';
import { Volume } from 'memfs';
import { loadTemplate, readTemplateEntities } from './loader';
import path from 'path';
import {
  EXTEND_TEMPLATE_LABEL_PREFIX,
  EXTEND_TEMPLATE_PATHNAME_PREFIX,
  MAIN_TEMPLATE_PATHNAME_PREFIX,
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_CONFIG_FILE_NAMES,
  TEMPLATE_FILE_PREFIX,
} from './constants';
import requireFromString from 'require-from-string';
import { answersParser } from './props';
import { diff, merge, parseDiffToMergeBlocks, parseMergeBlocksToText } from './diff';
import ejs from 'ejs';
import { getFileConfigGlobs } from './files';
import { GlobMatcher } from './matchers';

class Generator {
  public templateName: string;
  public templateOrigin: string;
  protected origins: DollieOrigin[] = [];
  protected volume: FileSystem;
  protected templateConfig: DollieTemplateConfig = {};
  protected cacheTable: CacheTable = {};
  protected mergeTable: MergeTable = {};
  protected binaryTable: BinaryTable = {};
  protected conflicts: ConflictItem[] = [];
  private templatePropsList: TemplatePropsItem[] = [];
  private pendingTemplateLabels: string[] = [];
  private targetedExtendTemplateIds: string[] = [];
  private filePatterns: Record<string, string[]> = {};
  private matcher: GlobMatcher;

  public constructor(
    protected projectName: string,
    private templateOriginName: string,
    private config: DollieConfig = {},
  ) {
    this.templateName = '';
    this.templateOrigin = '';
    this.origins = [githubOrigin, gitlabOrigin];
    this.volume = new Volume();
    this.pendingTemplateLabels.push('main');
  }

  public checkInputs() {
    if (!this.templateOriginName || !_.isString(this.templateOriginName)) {
      throw new InvalidInputError('name should be a string');
    }
    if (!this.projectName || !_.isString(this.projectName)) {
      throw new InvalidInputError('projectName should be a string');
    }
  }

  public initialize() {
    const { origins: customOrigins = [] } = this.config;
    this.origins = this.origins.concat(customOrigins);
    if (_.isString(this.templateOriginName)) {
      [this.templateName, this.templateOrigin = 'github'] = this.templateOriginName.split(':');
    }
    this.volume.mkdirSync(TEMPLATE_CACHE_PATHNAME_PREFIX, { recursive: true });
  }

  public checkContext() {
    const originIds = this.origins.map((origin) => origin.name);
    const uniqueOriginIds = _.uniq(originIds);
    if (originIds.length > uniqueOriginIds.length) {
      throw new ContextError('duplicated origin names');
    }
  }

  public async loadTemplate() {
    const origin = this.origins.find((origin) => origin.name === this.templateOrigin);

    if (!origin) {
      throw new ContextError(`origin name \`${this.templateOrigin}\` not found`);
    }

    if (!_.isFunction(origin.handler)) {
      throw new ContextError(`origin \`${this.templateOrigin}\` has a wrong handler type`);
    }

    const { url, headers } = await origin.handler(
      this.templateName,
      _.get(this.config, `origins.${this.templateOrigin}`),
    );

    if (!_.isString(url) || !url) {
      throw new ContextError(`origin \`${this.templateOrigin}\` url parsed with errors`);
    }

    const duration = await loadTemplate(url, this.volume, {
      headers,
      ...({
        timeout: 90000,
      }),
      ...this.config.loader,
    });

    this.templateConfig = this.getTemplateConfig();

    return duration;
  }

  public async queryAllTemplateProps() {
    while (this.pendingTemplateLabels.length !== 0) {
      const currentPendingExtendTemplateLabel = this.pendingTemplateLabels.shift();
      if (currentPendingExtendTemplateLabel === 'main') {
        await this.getTemplateProps();
      } else if (currentPendingExtendTemplateLabel.startsWith(EXTEND_TEMPLATE_LABEL_PREFIX)) {
        await this.getTemplateProps(currentPendingExtendTemplateLabel);
        this.targetedExtendTemplateIds.push(
          currentPendingExtendTemplateLabel.slice(EXTEND_TEMPLATE_LABEL_PREFIX.length),
        );
      }
    }
    await this.generateFilePatterns();
    this.matcher = new GlobMatcher(this.filePatterns);
    return _.clone(this.templatePropsList);
  }

  public copyTemplateFileToCacheTable() {
    for (const propItem of this.templatePropsList) {
      const { label, props } = propItem;
      let templateStartPathname: string;
      if (label === 'main') {
        templateStartPathname = this.mainTemplatePathname();
      } else if (label.startsWith(EXTEND_TEMPLATE_PATHNAME_PREFIX)) {
        const extendTemplateId = label.slice(EXTEND_TEMPLATE_LABEL_PREFIX.length);
        templateStartPathname = this.extendTemplatePathname(extendTemplateId);
      }

      if (!templateStartPathname) { return; }

      const entities = readTemplateEntities(this.volume, templateStartPathname);

      for (const entity of entities) {
        const {
          absolutePathname,
          entityName,
          isBinary,
          isDirectory,
          relativeDirectoryPathname,
        } = entity;
        if (isDirectory) { continue; }
        if (isBinary) {
          this.binaryTable[`${relativeDirectoryPathname}/${entityName}`]
            = this.volume.readFileSync(absolutePathname) as Buffer;
        } else {
          const fileRawContent = this.volume.readFileSync(absolutePathname).toString();
          let fileContent: string;

          if (entityName.startsWith(TEMPLATE_FILE_PREFIX)) {
            fileContent = ejs.render(fileRawContent, props);
          } else {
            fileContent = fileRawContent;
          }

          const currentFileName = entityName.startsWith(TEMPLATE_FILE_PREFIX)
            ? entityName.slice(TEMPLATE_FILE_PREFIX.length)
            : entityName;
          const currentFileRelativePathname = `${relativeDirectoryPathname}/${currentFileName}`;

          const currentFileDiffChanges = diff(fileContent);
          if (
            !this.cacheTable[currentFileRelativePathname]
              || !_.isArray(this.cacheTable[currentFileRelativePathname])
          ) {
            this.cacheTable[currentFileRelativePathname] = [];
          }
          const currentCacheTableItem = this.cacheTable[currentFileRelativePathname];
          currentCacheTableItem.push(currentFileDiffChanges);
        }
      }
    }
  }

  public deleteFiles() {
    this.cacheTable = Object.keys(this.cacheTable).reduce((result, pathname) => {
      if (!this.matcher.match(pathname, 'delete')) {
        result[pathname] = this.cacheTable[pathname];
      }
      return result;
    }, {} as CacheTable);
  }

  public mergeTemplateFiles() {
    for (const entityPathname of Object.keys(this.cacheTable)) {
      const diffs = this.cacheTable[entityPathname];
      if (!diffs || !_.isArray(diffs) || diffs.length === 0) {
        continue;
      }
      if (this.matcher.match(entityPathname, 'merge')) {
        if (diffs.length === 1) {
          this.mergeTable[entityPathname] = parseDiffToMergeBlocks(diffs[0]);
        } else {
          const originalDiffChanges = diffs[0];
          const forwardDiffChangesGroup = diffs.slice(1);
          const mergedDiffChanges = merge(originalDiffChanges, forwardDiffChangesGroup);
          this.mergeTable[entityPathname] = parseDiffToMergeBlocks(mergedDiffChanges);
        }
      } else {
        this.mergeTable[entityPathname] = parseDiffToMergeBlocks(_.last(diffs));
      }
    }
  }

  public async resolveConflicts() {
    const { conflictsSolver } = this.config;
    if (!_.isFunction(conflictsSolver)) {
      return;
    }
    let remainedConflictedFileDataList = this.getConflictedFileDataList();
    while (remainedConflictedFileDataList.length > 0) {
      const { pathname, index } = remainedConflictedFileDataList.shift();
      const result = await conflictsSolver({
        pathname,
        index,
        block: this.mergeTable[pathname][index],
      });
      if (result) {
        this.mergeTable[pathname][index] = result;
      } else {
        this.mergeTable[pathname][index] = {
          ...this.mergeTable[pathname][index],
          ignored: true,
        };
      }
    }
  }

  public async runCleanups() {
    const cleanups = (_.get(this.templateConfig, 'cleanups') || [])
      .concat(this.targetedExtendTemplateIds.reduce((result, templateId) => {
        const currentCleanups = _.get(this.templateConfig, `extendTemplates.${templateId}.cleanups`) || [];
        return result.concat(currentCleanups);
      }, []))
      .filter((cleanup) => _.isFunction(cleanup)) as DollieTemplateCleanUpFunction[];
    for (const cleanup of cleanups) {
      this.mergeTable = await cleanup(
        this.templateConfig,
        this.mergeTable,
        this.targetedExtendTemplateIds,
      );
    }
  }

  public getResult(): DollieGeneratorResult {
    let files = Object.keys(this.mergeTable).reduce((result, pathname) => {
      result[pathname] = parseMergeBlocksToText(this.mergeTable[pathname]);
      return result;
    }, {});
    files = _.merge(this.binaryTable, files);
    const conflicts = this.getIgnoredConflictedFilePathnameList();
    return { files, conflicts };
  }

  protected mainTemplatePathname(pathname = '') {
    return `${TEMPLATE_CACHE_PATHNAME_PREFIX}${MAIN_TEMPLATE_PATHNAME_PREFIX}${pathname ? `/${pathname}` : ''}`;
  }

  protected extendTemplatePathname(templateId: string, pathname = '') {
    const BASE_PATH = `${TEMPLATE_CACHE_PATHNAME_PREFIX}${TEMPLATE_CACHE_PATHNAME_PREFIX}`;

    if (!templateId) {
      return null;
    }

    return `${BASE_PATH}/${templateId}${pathname ? `/${pathname}` : ''}`;
  }

  private async generateFilePatterns() {
    for (const type of ['merge', 'delete']) {
      this.filePatterns[type] = await getFileConfigGlobs(
        this.templateConfig,
        this.targetedExtendTemplateIds,
        type,
      );
    }
  }

  private getConflictedFileDataList() {
    const conflicts: ConflictBlockMetadata[] = [];
    for (const pathname of Object.keys(this.mergeTable)) {
      const mergeBlocks = this.mergeTable[pathname];
      for (const [index, mergeBlock] of mergeBlocks.entries()) {
        if (mergeBlock.status === 'CONFLICT' && !mergeBlock.ignored) {
          conflicts.push({
            pathname,
            index,
          });
        }
      }
    }
    return conflicts;
  }

  private getIgnoredConflictedFilePathnameList() {
    const result: string[] = [];
    for (const pathname of Object.keys(this.mergeTable)) {
      const mergeBlocks = this.mergeTable[pathname];
      for (const mergeBlock of mergeBlocks) {
        if (mergeBlock.status === 'CONFLICT' && mergeBlock.ignored) {
          result.push(pathname);
        }
      }
    }
    return result;
  }

  private async getTemplateProps(extendTemplateLabel = null) {
    const { getTemplateProps } = this.config;
    const questions = (extendTemplateLabel && _.isString(extendTemplateLabel))
      ? _.get(this.templateConfig, `extendTemplates.${extendTemplateLabel}.questions`)
      : _.get(this.templateConfig, 'questions');

    if (_.isFunction(getTemplateProps) && (questions && _.isArray(questions) && questions.length > 0)) {
      const answers = await getTemplateProps(this.templateConfig.questions);
      const { props = {}, pendingExtendTemplateLabels = [] } = answersParser(answers);

      this.templatePropsList.push({
        props,
        label: extendTemplateLabel ? extendTemplateLabel : 'main',
      });

      if (pendingExtendTemplateLabels.length > 0) {
        for (const pendingExtendTemplateLabel of pendingExtendTemplateLabels) {
          this.pendingTemplateLabels.push(`${EXTEND_TEMPLATE_LABEL_PREFIX}${pendingExtendTemplateLabel}`);
        }
      }
    }
  }

  private readTemplateFileBuffer(pathname: string): Buffer {
    return this.volume.readFileSync(path.resolve(
      TEMPLATE_CACHE_PATHNAME_PREFIX,
      pathname,
    )) as Buffer;
  }

  private checkFile(pathname: string): boolean {
    const absolutePathname = path.resolve(TEMPLATE_CACHE_PATHNAME_PREFIX, pathname);
    return (
      this.volume.existsSync(absolutePathname)
      && this.volume.statSync(absolutePathname).isFile()
    );
  }

  private getTemplateConfig() {
    let configFileName: string;

    for (const fileName of TEMPLATE_CONFIG_FILE_NAMES) {
      if (this.checkFile(fileName)) {
        configFileName = fileName;
        break;
      }
    }

    if (!configFileName) {
      return {} as DollieTemplateConfig;
    }

    const dollieConfigFileContent = this.readTemplateFileBuffer(configFileName).toString();

    if (configFileName.endsWith('.json')) {
      try {
        return JSON.parse(dollieConfigFileContent) as DollieTemplateConfig;
      } catch {
        return {} as DollieTemplateConfig;
      }
    } else if (configFileName.endsWith('.js')) {
      return (requireFromString(dollieConfigFileContent) || {}) as DollieTemplateConfig;
    } else {
      return {} as DollieTemplateConfig;
    }
  }
}

export default Generator;
