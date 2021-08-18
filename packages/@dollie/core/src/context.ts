import _ from 'lodash';
import {
  DollieError,
} from './errors';
import Generator from './generators/generator.abstract';
import ProjectGenerator from './generators/project.generator';
import {
  Config,
  ContextStatusMap,
  ErrorHandler,
  MessageHandler,
  StatusChangeHandler,
} from './interfaces';

class Context {
    protected generator: Generator;
    private errorHandler: ErrorHandler;
    private messageHandler: MessageHandler;
    private statusChangeHandler: StatusChangeHandler;
    private lifecycleList: string[] = ['bootstrap', 'load', 'write', 'conflict', 'end'];
    private statusMap: ContextStatusMap;
    private generatorClassMap: Record<string, typeof Generator> = {
      project: ProjectGenerator,
    };

    public constructor(
      protected projectName: string,
      private templateOriginName: string,
      private config: Config = {},
    ) {
      const { onStatusChange, onError, onMessage } = config;
      this.errorHandler = _.isFunction(onError) ? onError : _.noop;
      this.messageHandler = _.isFunction(onMessage) ? onMessage : _.noop;
      this.statusChangeHandler = _.isFunction(onStatusChange) ? onStatusChange : _.noop;
      this.statusMap = this.initializeStatus();
    }

    public async generate() {
      try {
        for (const lifecycle of this.lifecycleList) {
          const lifecycleExecutor = this[lifecycle];
          if (_.isFunction(lifecycleExecutor)) {
            await lifecycleExecutor.call(this);
          }
        }
        return this.generator.getResult();
      } catch (e) {
        this.errorHandler(new DollieError(e.message || 'unknown error'));
      }
    }

    protected async bootstrap() {
      this.updateRunningStatus('bootstrap');
      const {
        projectName,
        templateOriginName,
        config,
      } = this;
      const { type = 'project' } = config;
      const ContextGenerator = this.generatorClassMap[type];
      if (!(ContextGenerator instanceof Generator)) {
        this.errorHandler(new DollieError('cannot assign an appropriate generator'));
        return;
      }
      this.generator = new ContextGenerator(projectName, templateOriginName, {
        ...(config.generator || {}),
        onMessage: this.messageHandler,
      });
      this.generator.checkInputs();
      await this.generator.initialize();
      this.generator.checkContext();
      this.updateFinishedStatus('bootstrap');
    }

    protected async load() {
      this.updateRunningStatus('load');
      await this.generator.loadTemplate();
      await this.generator.queryAllTemplateProps();
      this.updateFinishedStatus('load');
    }

    protected write() {
      this.updateRunningStatus('write');
      this.generator.copyTemplateFileToCacheTable();
      this.generator.deleteFiles();
      this.generator.mergeTemplateFiles();
      this.updateFinishedStatus('write');
    }

    protected async conflict() {
      this.updateRunningStatus('conflict');
      await this.generator.resolveConflicts();
      this.updateFinishedStatus('conflict');
    }

    protected async end() {
      this.updateRunningStatus('end');
      await this.generator.runCleanups();
      this.updateFinishedStatus('end');
    }

    private initializeStatus() {
      return this.lifecycleList.reduce((result, lifecycleName) => {
        result[lifecycleName] = 'pending';
        return result;
      }, {} as ContextStatusMap);
    }

    private updateRunningStatus(lifecycleName: string) {
      const lifecycleIndex = Object.keys(this.statusMap).findIndex((currentLifecycleName) => {
        return currentLifecycleName === lifecycleName;
      });

      if (lifecycleIndex === -1) {
        return;
      }

      const statusMap = _.clone(this.statusMap);
      const lifecycleNames = Object.keys(statusMap);

      const finishedLifecycleNames = lifecycleNames.slice(0, lifecycleIndex);
      const pendingLifecycleNames = lifecycleNames.slice(lifecycleIndex + 1);

      this.statusMap = lifecycleNames.reduce((result, currentLifecycleName) => {
        if (lifecycleName === currentLifecycleName) {
          result[currentLifecycleName] = 'running';
        } else if (finishedLifecycleNames.includes(currentLifecycleName)) {
          result[currentLifecycleName] = 'finished';
        } else if (pendingLifecycleNames.includes(currentLifecycleName)) {
          result[currentLifecycleName] = 'pending';
        }
        return result;
      }, {} as ContextStatusMap);

      this.statusChangeHandler(this.statusMap);
    }

    private updateFinishedStatus(lifecycleName: string) {
      if (_.isString(this.statusMap[lifecycleName])) {
        this.statusMap[lifecycleName] = 'finished';
      }
    }
}

export default Context;
