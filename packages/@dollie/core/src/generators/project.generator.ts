import {
  CacheTable,
  ConflictBlockMetadata,
  DiffChange,
  GeneratorConfig,
  GeneratorResult,
  TemplateCleanUpFunction,
  TemplatePropsItem,
} from '../interfaces';
import * as _ from 'lodash';
import {
  InvalidInputError,
  ContextError,
} from '../errors';
import {
  readTemplateEntities,
} from '../loader';
import {
  EXTEND_TEMPLATE_LABEL_PREFIX,
  EXTEND_TEMPLATE_PATHNAME_PREFIX,
  MAIN_TEMPLATE_PATHNAME_PREFIX,
  TEMPLATE_CACHE_PATHNAME_PREFIX,
  TEMPLATE_FILE_PREFIX,
} from '../constants';
import {
  answersParser,
} from '../props';
import {
  diff,
  merge,
  parseDiffToMergeBlocks,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
} from '../diff';
import ejs from 'ejs';
import {
  getFileConfigGlobs,
} from '../files';
import {
  GlobMatcher,
} from '../matchers';
import Generator from './generator.abstract';

class ProjectGenerator extends Generator implements Generator {
  private templatePropsList: TemplatePropsItem[] = [];
  private pendingTemplateLabels: string[] = [];
  private targetedExtendTemplateIds: string[] = [];
  // glob pathname matcher
  private matcher: GlobMatcher;

  /**
   * Generator constructor
   * @param {string} projectName name of project that to be generated
   * @param {string} templateId origin context id, read by generator
   * @param {GeneratorConfig} config generator configuration
   */
  public constructor(
    projectName: string,
    templateId: string,
    config: GeneratorConfig = {},
  ) {
    super(projectName, templateId, config);
    this.pendingTemplateLabels.push('main');
  }

  public checkInputs() {
    this.messageHandler('Validating inputs...');
    if (!this.templateId || !_.isString(this.templateId)) {
      throw new InvalidInputError('Parameter `name` should be a string');
    }
    if (!this.projectName || !_.isString(this.projectName)) {
      throw new InvalidInputError('Parameter `projectName` should be a string');
    }
  }

  public async initialize() {
    this.origins = _.get(this, 'config.origins') || [];

    // parse the origin id and template id
    if (_.isString(this.templateId)) {
      if (!this.templateId.includes(':')) {
        this.templateOrigin = 'github';
        this.templateName = this.templateId;
      } else {
        [
          this.templateOrigin = 'github',
          this.templateName,
        ] = this.templateId.split(':');
      }
    }

    this.messageHandler('Preparing cache directory...');
    this.volume.mkdirSync(TEMPLATE_CACHE_PATHNAME_PREFIX, { recursive: true });
    this.messageHandler('Initialization finished successfully');
  }

  public checkContext() {
    this.messageHandler('Checking runtime context...');
    const originIds = this.origins.map((origin) => origin.name);
    const uniqueOriginIds = _.uniq(originIds);
    if (originIds.length > uniqueOriginIds.length) {
      throw new ContextError('duplicated origin names');
    }
  }

  /**
   * get all props from main template and each extend template
   * @returns {TemplatePropsItem[]}
   */
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

    // get glob file patterns and create matcher
    const patterns = await this.generateFilePatterns();
    this.matcher = new GlobMatcher(patterns);

    return _.clone(this.templatePropsList);
  }

  /**
   * traverse all files, and get the contents from them
   * get the diff changes from the initial content of current file
   * and then push diff changes to cacheTable
   * @returns {void}
   */
  public copyTemplateFileToCacheTable() {
    this.messageHandler('Generating template files...');

    const mainTemplateProps =
      this.templatePropsList.find((item) => item.label === 'main') ||
      {};

    if (!mainTemplateProps) {
      return;
    }

    const templateIds = ['main'].concat(
      this.targetedExtendTemplateIds.map((id) => `extend:${id}`),
    );

    for (const templateId of templateIds) {
      const templatePropsItem = this.templatePropsList.find(
        (item) => item.label === templateId,
      );

      if (!templatePropsItem) {
        continue;
      }

      const { label, props } = templatePropsItem;
      let templateStartPathname: string;

      /**
       * template label format:
       * main template: `main`
       * extend template: `extend:{name}`
       */
      if (label === 'main') {
        templateStartPathname = this.mainTemplatePathname();
      } else if (label.startsWith(EXTEND_TEMPLATE_LABEL_PREFIX)) {
        // slice extend template label to get the id of current extend template
        const extendTemplateId = label.slice(EXTEND_TEMPLATE_LABEL_PREFIX.length);
        templateStartPathname = this.extendTemplatePathname(extendTemplateId);
      }

      if (!templateStartPathname) { continue; }

      // traverse template structure and get all entities
      const entities = readTemplateEntities(this.volume, templateStartPathname);

      for (const entity of entities) {
        const {
          absolutePathname,
          entityName,
          isBinary,
          isDirectory,
          relativeDirectoryPathname: relativePathname,
        } = entity;

        if (isDirectory) { continue; }

        if (isBinary) {
          this.binaryTable[`${relativePathname}/${entityName}`]
            = this.volume.readFileSync(absolutePathname) as Buffer;
        } else {
          const fileRawContent = this.volume.readFileSync(absolutePathname).toString();
          let currentFileContent: string;

          // detect if current file is a template file
          if (entityName.startsWith(TEMPLATE_FILE_PREFIX)) {
            currentFileContent = ejs.render(fileRawContent, _.merge(mainTemplateProps, props));
          } else {
            currentFileContent = fileRawContent;
          }

          const currentFileName = entityName.startsWith(TEMPLATE_FILE_PREFIX)
            ? entityName.slice(TEMPLATE_FILE_PREFIX.length)
            : entityName;
          const currentFileRelativePathname = `${relativePathname ? `${relativePathname}/` : ''}${currentFileName}`;

          let currentFileDiffChanges: DiffChange[];
          if (
            !this.cacheTable[currentFileRelativePathname] ||
            this.cacheTable[currentFileRelativePathname].length === 0 ||
            !_.isArray(this.cacheTable[currentFileRelativePathname])
          ) {
            // if cacheTable does not have a record for current file
            this.cacheTable[currentFileRelativePathname] = [];
            // set initial diff changes
            currentFileDiffChanges = diff(currentFileContent);
          } else {
            const originalFileDiffChanges = this.cacheTable[currentFileRelativePathname][0];
            const originalFileContent = originalFileDiffChanges.map((diffItem) => diffItem.value).join('');
            currentFileDiffChanges = diff(originalFileContent, currentFileContent);
          }

          this.cacheTable[currentFileRelativePathname].push(currentFileDiffChanges);
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
          // merge diff changes if current file is written more than once
          const mergedDiffChanges = merge(originalDiffChanges, forwardDiffChangesGroup);
          this.mergeTable[entityPathname] = parseDiffToMergeBlocks(mergedDiffChanges);
        }
      } else {
        // if current file does not match patterns in `merge`
        // then get the content from the last diff changes
        this.mergeTable[entityPathname] = parseDiffToMergeBlocks(_.last(diffs));
      }
    }
  }

  /**
   * check for conflicted blocks and throw them to user to get solved blocks
   * @returns {void}
   */
  public async resolveConflicts() {
    const { conflictsSolver } = this.config;

    if (!_.isFunction(conflictsSolver)) {
      return;
    }

    const remainedConflictedFileDataList = this.getConflictedFileDataList();
    const totalConflicts = _.clone(remainedConflictedFileDataList);

    while (remainedConflictedFileDataList.length > 0) {
      const { pathname, index } = remainedConflictedFileDataList.shift();

      const currentPathnameConflicts = totalConflicts.filter((item) => {
        return item.pathname === pathname;
      });

      const total = currentPathnameConflicts.length;
      const currentIndex = currentPathnameConflicts.findIndex((conflict) => {
        return index === conflict.index;
      });

      const result = await conflictsSolver({
        pathname,
        total,
        block: this.mergeTable[pathname][index],
        index: currentIndex,
        content: parseMergeBlocksToText(this.mergeTable[pathname]),
      });

      /**
       * deal with the return value from `conflictsSolver`:
       * - null: user skips current block, throw again
       * - 'ignored': user ignores current block, continue
       * - MergeBlock: user solves current block, overwrite `mergeTable`
       */
      if (_.isNull(result)) {
        remainedConflictedFileDataList.unshift({ pathname, index });
      } else if (result === 'ignored') {
        this.mergeTable[pathname][index] = {
          ...this.mergeTable[pathname][index],
          ignored: true,
        };
      } else if (!_.isEmpty(result)) {
        this.mergeTable[pathname][index] = {
          ...result,
          status: 'OK',
        };
      }
    }
  }

  public async runCleanups() {
    this.messageHandler('Running cleanup functions...');

    const clonedTables = {
      mergeTable: _.clone(this.mergeTable),
      binaryTable: _.clone(this.binaryTable),
    };

    const cleanups = (_.get(this.templateConfig, 'cleanups') || [])
      .concat(this.targetedExtendTemplateIds.reduce((result, templateId) => {
        const currentCleanups = _.get(this.templateConfig, `extendTemplates.${templateId}.cleanups`) || [];
        return result.concat(currentCleanups);
      }, []))
      .filter((cleanup) => _.isFunction(cleanup)) as TemplateCleanUpFunction[];

    const addFile = (pathname: string, content: string) => {
      if (!clonedTables.mergeTable[pathname]) {
        clonedTables.mergeTable[pathname] = parseFileTextToMergeBlocks(content);
      }
    };

    const addTextFile = addFile;

    const addBinaryFile = (pathname: string, content: Buffer) => {
      if (!clonedTables.binaryTable[pathname]) {
        clonedTables.binaryTable[pathname] = content;
      }
    };

    const deleteFiles = (pathnameList: string[]) => {
      for (const pathname of pathnameList) {
        clonedTables.mergeTable[pathname] = null;
        clonedTables.binaryTable[pathname] = null;
      }
    };

    const exists = (pathname: string): boolean => {
      return Boolean(this.mergeTable[pathname]);
    };

    const getTextFileContent = (pathname: string) => {
      return parseMergeBlocksToText(this.mergeTable[pathname]);
    };

    const getBinaryFileBuffer = (pathname: string) => {
      return this.binaryTable[pathname];
    };

    for (const cleanup of cleanups) {
      await cleanup({
        addFile,
        addTextFile,
        addBinaryFile,
        deleteFiles,
        exists,
        getTextFileContent,
        getBinaryFileBuffer,
      });
    }

    Object.keys(clonedTables).forEach((tableName) => {
      this[tableName] = Object.keys(clonedTables[tableName]).reduce((result, pathname) => {
        const content = clonedTables[tableName][pathname];
        if (!_.isNull(content)) {
          result[pathname] = content;
        }
        return result;
      }, {});
    });
  }

  public getResult(): GeneratorResult {
    let files = Object.keys(this.mergeTable).reduce((result, pathname) => {
      result[pathname] = parseMergeBlocksToText(this.mergeTable[pathname]);
      return result;
    }, {});
    files = _.merge(this.binaryTable, files);
    const conflicts = this.getIgnoredConflictedFilePathnameList();
    this.messageHandler('Generator finished successfully');
    return { files, conflicts };
  }

  protected mainTemplatePathname(pathname = '') {
    return TEMPLATE_CACHE_PATHNAME_PREFIX +
      MAIN_TEMPLATE_PATHNAME_PREFIX +
      (pathname ? `/${pathname}` : '');
  }

  protected extendTemplatePathname(templateId: string, pathname = '') {
    const BASE_PATH =
      TEMPLATE_CACHE_PATHNAME_PREFIX +
      EXTEND_TEMPLATE_PATHNAME_PREFIX;

    if (!templateId) {
      return null;
    }

    return BASE_PATH +
      '/' +
      templateId +
      (pathname ? `/${pathname}` : '');
  }

  private async generateFilePatterns() {
    const patterns = {};

    for (const type of ['merge', 'delete']) {
      patterns[type] = await getFileConfigGlobs(
        this.templateConfig,
        this.targetedExtendTemplateIds,
        type,
      );
    }

    return patterns;
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
        if (mergeBlock.status === 'CONFLICT') {
          result.push(pathname);
        }
      }
    }

    return _.uniq(result);
  }

  private async getTemplateProps(extendTemplateLabel = null) {
    const { getTemplateProps } = this.config;
    const questions = (extendTemplateLabel && _.isString(extendTemplateLabel))
      ? _.get(this.templateConfig, `extendTemplates.${extendTemplateLabel}.questions`)
      : _.get(this.templateConfig, 'questions');

    if (_.isFunction(getTemplateProps)) {
      let props = {};
      if (questions && _.isArray(questions) && questions.length > 0) {
        const answers = await getTemplateProps(this.templateConfig.questions);
        const { props: currentProps = {}, pendingExtendTemplateLabels = [] } = answersParser(answers);

        props = currentProps;

        if (pendingExtendTemplateLabels.length > 0) {
          for (const pendingExtendTemplateLabel of pendingExtendTemplateLabels) {
            this.pendingTemplateLabels.push(`${EXTEND_TEMPLATE_LABEL_PREFIX}${pendingExtendTemplateLabel}`);
          }
        }
      }
      this.templatePropsList.push({
        props,
        label: extendTemplateLabel ? extendTemplateLabel : 'main',
      });
    }
  }
}

export default ProjectGenerator;
