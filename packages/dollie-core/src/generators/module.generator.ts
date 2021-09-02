import {
  ModuleGeneratorConfig,
  FileTable,
  ModuleTemplateConfig,
  TemplateFileItem,
  MergeTable,
  GeneratorResult,
  ModuleConfigHandlerContext,
} from '../interfaces';
import {
  Answers as InquirerAnswers,
} from 'inquirer';
import Generator from '../generator.abstract';
import * as _ from 'lodash';
import {
  diff,
  parseFileTextToMergeBlocks,
  parseMergeBlocksToText,
  parseDiffToMergeBlocks,
} from '../diff';
import {
  ParameterInvalidError,
  ModuleInvalidError,
  ModuleNotFoundError,
  ModuleValidateError,
  ModulePropsIncompatibleError,
} from '../errors';
import {
  TEMPLATE_CACHE_PATHNAME_PREFIX,
} from '../constants';
import {
  readTemplateEntities,
} from '../utils/loader';
import mustache from 'mustache';
import {
  getModuleFileConfigGlobs,
} from '../utils/files';
import {
  GlobMatcher,
} from '../utils/matchers';
import {
  TemplateEntity,
  FileContent,
} from '@dollie/utils';
import ejs from 'ejs';

class ModuleGenerator extends Generator implements Generator {
  private modulePathname: string;
  private entities: TemplateEntity[] = [];
  private moduleTemplateConfig: ModuleTemplateConfig = {};
  private moduleProps: InquirerAnswers = {};
  private fileTable: FileTable = {};
  private projectMergeTable: MergeTable = {};

  public constructor(
    templateId: string,
    private moduleId: string,
    private files: TemplateFileItem[],
    config: ModuleGeneratorConfig = {},
  ) {
    super(templateId, config);
    this.modulePathname = TEMPLATE_CACHE_PATHNAME_PREFIX + '/modules/' + this.moduleId;
  }

  public checkInputs() {
    super.checkInputs();

    if (!this.fileTable || !_.isObjectLike(this.fileTable)) {
      this.errorHandler(new ParameterInvalidError('fileTable'));
    }

    if (!this.moduleId || !_.isString(this.moduleId)) {
      this.errorHandler(new ParameterInvalidError('moduleId'));
    }
  }

  public initialize() {
    this.volume.mkdirSync(TEMPLATE_CACHE_PATHNAME_PREFIX, { recursive: true });
    this.messageHandler('Parsing project files...');
    this.parseProjectFiles();
    this.messageHandler('Initialization finished successfully');
  }

  public async checkContext() {
    await super.checkContext();
  }

  public async loadTemplate() {
    const duration = await super.loadTemplate();

    if (!this.volume.existsSync(this.modulePathname)) {
      this.errorHandler(new ModuleNotFoundError(this.moduleId));
    }

    if (!this.volume.statSync(this.modulePathname).isDirectory()) {
      this.errorHandler(new ModuleInvalidError(this.moduleId));
    }

    this.moduleTemplateConfig = _.get(this.templateConfig, `modules.${this.moduleId}`) || {};
    const {
      alias = {},
    } = this.moduleTemplateConfig;

    this.messageHandler('Parsing module entities...');
    this.entities = readTemplateEntities(this.volume, this.modulePathname).map((entity) => {
      const {
        relativePathname,
      } = entity;

      if (/\{\{.*\}\}/g.test(relativePathname)) {
        return entity;
      }

      const targetAliasPathname = alias[relativePathname];

      if (!_.isString(targetAliasPathname)) {
        return entity;
      }

      return {
        ...entity,
        relativePathname: targetAliasPathname,
      };
    });

    this.messageHandler('Validating module props...');
    if (!this.validateModuleProps()) {
      this.errorHandler(new ModulePropsIncompatibleError());
    }

    return duration;
  }

  public async queryAllTemplateProps() {
    const {
      questions = [],
      validate,
    } = this.moduleTemplateConfig;

    const { getTemplateProps } = this.config;

    if (_.isFunction(getTemplateProps) && questions.length > 0) {
      this.moduleProps = await getTemplateProps(questions);
    }

    const patterns = await this.generateFilePatterns();
    this.matcher = new GlobMatcher(patterns);

    if (_.isFunction(validate)) {
      const result = await validate({
        moduleId: this.moduleId,
        props: this.moduleProps,
        context: {
          request: this.request,
          lodash: _,
        },
        exists: this.exists.bind(this),
        getFileContent: this.getFileContent.bind(this),
      });

      if (_.isBoolean(result) && !result) {
        this.errorHandler(new ModuleValidateError(this.moduleId));
      }
    }

    return _.clone(this.moduleProps);
  }

  public copyTemplateFileToCacheTable() {
    this.messageHandler('Generating module files...');

    for (const entity of this.entities) {
      const {
        relativePathname,
        absoluteOriginalPathname,
        isBinary,
        isDirectory,
      } = entity;

      if (isDirectory) {
        continue;
      }

      const entityPathname = mustache.render(relativePathname, this.moduleProps);
      const contentBuffer = this.volume.readFileSync(absoluteOriginalPathname);

      if (isBinary) {
        this.binaryTable[entityPathname] = contentBuffer as Buffer;
        continue;
      }

      const content = ejs.render(contentBuffer.toString(), this.moduleProps);

      if (!_.isArray(this.cacheTable[entityPathname])) {
        this.cacheTable[entityPathname] = [diff(content)];
      } else {
        const originalContent = this.fileTable[entityPathname];
        const diffChange = _.isString(originalContent)
          ? diff(originalContent, content)
          : diff(content);
        this.cacheTable[entityPathname].push(diffChange);
      }
    }
  }

  public mergeTemplateFiles() {
    super.mergeTemplateFiles(false);
  }

  public resolveConflicts() {
    this.messageHandler('Resolving conflicts...');

    const solvedMergeTable = Object.keys(this.mergeTable).reduce((result, pathname) => {
      const mergeBlocks = this.mergeTable[pathname];
      const solvedMergeBlocks = mergeBlocks.map((mergeBlock) => {
        const {
          status,
          values,
        } = mergeBlock;

        if (status === 'OK') {
          return mergeBlock;
        }

        const {
          former = [],
          current = [],
        } = values;

        const solvedMergeBlock = _.clone(mergeBlock);

        return _.set(solvedMergeBlock, 'values.current', Array.from(former).concat(current));
      });

      result[pathname] = solvedMergeBlocks;

      return result;
    }, {} as MergeTable);

    this.mergeTable = solvedMergeTable;
  }

  public getResult(): GeneratorResult {
    const currentFileTable = _.merge(this.binaryTable, Object.keys(this.mergeTable).reduce((result, pathname) => {
      result[pathname] = parseMergeBlocksToText(this.mergeTable[pathname]);
      return result;
    }, {} as FileTable));

    const files = Object.keys(currentFileTable).reduce((result, pathname) => {
      if (this.checkFileChanged(this.fileTable[pathname], currentFileTable[pathname])) {
        result[pathname] = currentFileTable[pathname];
      }

      return result;
    }, {} as FileTable);

    this.messageHandler('Generator finished successfully');

    return {
      files,
      conflicts: [],
    };
  }

  protected getCleanupFunctions() {
    const {
      cleanups = [],
    } = this.moduleTemplateConfig;
    return cleanups;
  }

  protected getClonedTables() {
    return {
      cacheTable: _.clone(this.cacheTable),
      binaryTable: _.clone(this.binaryTable),
      mergeTable: _.clone(this.mergeTable),
      projectMergeTable: _.clone(this.projectMergeTable),
    };
  }

  private parseProjectFiles() {
    for (const fileItem of this.files) {
      const {
        relativePathname,
        isBinary,
        isDirectory,
        content,
      } = fileItem;

      if (isDirectory) {
        continue;
      }

      if (isBinary && _.isBuffer(content)) {
        this.binaryTable[relativePathname] = content as Buffer;
        continue;
      }

      if (!isBinary && _.isString(content)) {
        this.fileTable[relativePathname] = content;
        this.cacheTable[relativePathname] = [diff(content)];
        this.projectMergeTable[relativePathname] = parseFileTextToMergeBlocks(content);
        continue;
      }
    }
  }

  private validateModuleProps() {
    const {
      questions = [],
    } = this.moduleTemplateConfig;

    const dependedProps = _.uniq(
      this.entities.reduce((tempResult, currentEntity) => {
        const {
          relativePathname,
        } = currentEntity;
        const currentResult = Array.from(tempResult);
        const spans = mustache.parse(relativePathname);

        for (const span of spans) {
          const [type, name] = span;
          if (type === 'name') {
            currentResult.push(name);
          }
        }

        return currentResult;
      }, []),
    );

    const providedProps = questions.map((question) => question.name);

    if (providedProps.length < dependedProps.length) {
      return false;
    }

    for (const providedPropName of providedProps) {
      if (!dependedProps.includes(providedPropName)) {
        return false;
      }
    }

    return true;
  }

  private async generateFilePatterns() {
    const data: ModuleConfigHandlerContext = {
      moduleId: this.moduleId,
      props: this.moduleProps,
      context: {
        request: this.request,
        lodash: _,
      },
      exists: this.exists.bind(this),
      getFileContent: this.getFileContent.bind(this),
    };

    const patterns = {};

    for (const type of ['merge', 'delete']) {
      patterns[type] = await getModuleFileConfigGlobs(
        this.moduleTemplateConfig,
        data,
        type,
      );
    }

    return patterns;
  }

  private checkFileChanged(
    originalContent: FileContent,
    currentContent: FileContent,
  ) {
    if (
      _.isBuffer(originalContent) ||
      (
        _.isString(originalContent) &&
        _.isString(currentContent) &&
        diff(originalContent, currentContent).filter((change) => !change.added && !change.removed).length > 0
      ) ||
      !originalContent
    ) {
      return true;
    }

    return false;
  }

  private exists(pathname: string) {
    return this.files.findIndex((file) => file.relativeOriginalPathname === pathname) !== -1;
  }

  private getFileContent(pathname: string) {
    const diffs = this.cacheTable[pathname];
    if (!_.isArray(diffs) || diffs.length === 0) {
      return '';
    }
    const currentFileDiff = diffs[0];
    return parseMergeBlocksToText(parseDiffToMergeBlocks(currentFileDiff));
  }
}

export default ModuleGenerator;
