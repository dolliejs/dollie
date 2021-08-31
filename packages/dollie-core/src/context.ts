import _ from 'lodash';
import {
  ContextError,
} from './errors';
import Generator from './generator.abstract';
import {
  Config,
  ContextStatusMap,
  ErrorHandler,
  MessageHandler,
  StatusChangeHandler,
  ModuleContextConfig,
} from './interfaces';

import ProjectGenerator from './generators/project.generator';
import ModuleGenerator from './generators/module.generator';

class Context {
    protected generator: Generator;
    private errorHandler: ErrorHandler;
    private messageHandler: MessageHandler;
    private statusChangeHandler: StatusChangeHandler;
    private lifecycleList: string[] = ['bootstrap', 'load', 'write', 'conflict', 'end'];
    private statusMap: ContextStatusMap;

    public constructor(
      private genericId: string,
      private config: Config = {},
    ) {
      const { onStatusChange, onMessage, generator = {} } = config;
      this.messageHandler = _.isFunction(onMessage) ? onMessage : _.noop;
      this.statusChangeHandler = _.isFunction(onStatusChange) ? onStatusChange : _.noop;
      this.statusMap = this.initializeStatus();
      this.errorHandler = generator.onError;

      if (!this.errorHandler || !_.isFunction(this.errorHandler)) {
        this.errorHandler = _.noop;
      }
    }

    public async generate() {
      for (const lifecycle of this.lifecycleList) {
        const lifecycleExecutor = this[lifecycle];
        if (_.isFunction(lifecycleExecutor)) {
          await lifecycleExecutor.call(this);
        }
      }
      const result = this.generator.getResult();
      return result;
    }

    protected async bootstrap() {
      this.updateRunningStatus('bootstrap');
      const {
        genericId,
        config,
      } = this;
      const { type = 'project' } = config;

      switch (type) {
        case 'project': {
          this.generator = new ProjectGenerator(genericId, {
            ...(config.generator || {}),
            onMessage: this.messageHandler,
          });
          break;
        }
        case 'module': {
          const {
            files = [],
            moduleId,
            ...restConfig
          } = (config.generator || {}) as ModuleContextConfig;
          this.generator = new ModuleGenerator(genericId, moduleId, files, {
            ...(restConfig),
            onMessage: this.messageHandler,
          });
          break;
        }
        default: {
          break;
        }
      }

      if (!this.generator) {
        this.errorHandler(new ContextError(undefined, 'Cannot assign an appropriate generator'));
      }

      this.generator.checkInputs();
      this.generator.checkContext();
      await this.generator.initialize();
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
