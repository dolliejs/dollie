import _ from 'lodash';
import { DollieOrigin } from '../../origins/lib';
import { DollieError } from './errors';
import Generator from './generator';
import {
  DollieConfig,
  DollieContextStatusMap,
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
  private statusMap: DollieContextStatusMap;

  public constructor(
    protected projectName: string,
    private templateOriginName: string,
    private config: DollieConfig = {},
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

  protected bootstrap() {
    this.updateRunningStatus('bootstrap');
    const {
      projectName,
      templateOriginName,
      config,
    } = this;
    this.generator = new Generator(projectName, templateOriginName, {
      ...(config.generator || {}),
      onMessage: this.messageHandler,
    });
    this.generator.checkInputs();
    this.generator.initialize();
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
    }, {} as DollieContextStatusMap);
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
    }, {} as DollieContextStatusMap);

    this.statusChangeHandler(this.statusMap);
  }

  private updateFinishedStatus(lifecycleName: string) {
    if (_.isString(this.statusMap[lifecycleName])) {
      this.statusMap[lifecycleName] = 'finished';
    }
  }
}

export default Context;
