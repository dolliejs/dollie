import {
  ModuleGeneratorConfig,
  FileTable,
  ModuleTemplateConfig,
  TemplateFileItem,
  MergeTable,
  GeneratorResult,
} from '../interfaces';
import {
  Answers as InquirerAnswers,
} from 'inquirer';
import Generator from '../generator.abstract';
import _ from 'lodash';
import {
  diff, parseMergeBlocksToText,
} from '../diff';
import {
  ParameterInvalidError,
  ModuleInvalidError,
  ModuleNotFoundError,
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
} from '@dollie/utils';
import ejs from 'ejs';

class ModuleGenerator extends Generator implements Generator {
  private modulePathname: string;
  private entities: TemplateEntity[] = [];
  private moduleTemplateConfig: ModuleTemplateConfig = {};
  private moduleProps: InquirerAnswers = {};
  private fileTable: FileTable = {};

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
    this.messageHandler('Parsing project files...');
    this.parseProjectFiles();
    this.messageHandler('Initialization finished successfully');
  }

  public async checkContext() {
    await super.checkContext();

    if (!this.volume.existsSync(this.modulePathname)) {
      this.errorHandler(new ModuleNotFoundError(this.moduleId));
    }

    if (!this.volume.statSync(this.modulePathname).isDirectory()) {
      this.errorHandler(new ModuleInvalidError(this.moduleId));
    }
  }

  public async loadTemplate() {
    const duration = await super.loadTemplate();

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

    this.validateModuleProps();

    return duration;
  }

  public async queryAllTemplateProps() {
    const {
      questions = [],
    } = this.moduleTemplateConfig;

    const { getTemplateProps } = this.config;

    if (_.isFunction(getTemplateProps) && questions.length > 0) {
      this.moduleProps = await getTemplateProps(questions);
    }

    const patterns = await this.generateFilePatterns();
    this.matcher = new GlobMatcher(patterns);

    return _.clone(this.moduleProps);
  }

  public copyTemplateFileToCacheTable() {
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

  public mergeTemplateFiles(removeLine = false) {
    super.mergeTemplateFiles(removeLine);
  }

  public resolveConflicts() {
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

  public runCleanups() {}

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

    return {
      files,
      conflicts: [],
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
        continue;
      }
    }
  }

  private validateModuleProps() {
    const {
      questions = [],
    } = this.moduleTemplateConfig;

    const dependedProps = this.entities.reduce((tempResult, currentEntity) => {
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
    }, []);

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
    return {
      delete: await getModuleFileConfigGlobs(
        this.templateConfig,
        this.moduleTemplateConfig,
        this.moduleProps,
      ),
    };
  }

  private checkFileChanged(
    originalContent: string | Buffer,
    currentContent: string | Buffer,
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
}

export default ModuleGenerator;