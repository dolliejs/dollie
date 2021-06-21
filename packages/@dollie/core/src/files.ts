import {
  DeleteConfigHandler,
  DollieTemplateConfig,
} from './interfaces';
import _ from 'lodash';

const getFileConfigGlobs = async (
  config: DollieTemplateConfig,
  targets: string[],
  type: string,
): Promise<string[]> => {
  let patterns = (_.get(config, `files.${type}`) || []) as (string | DeleteConfigHandler)[];
  for (const target of targets) {
    patterns = patterns.concat((_.get(config, `${target}.files.${type}`)) || [] as (string | DeleteConfigHandler)[]);
  }
  let result: string[] = [];
  for (const pattern of patterns) {
    if (_.isString(pattern)) {
      result.push(pattern);
    } else if (_.isFunction(pattern)) {
      const returnValue = pattern(config, targets);
      if (_.isArray(returnValue) && returnValue.length > 0) {
        result = result.concat(returnValue);
      } else if (_.isString(returnValue)) {
        result.push(returnValue);
      }
    }
  }
  return _.uniq(result.filter((item) => !!item).filter((item) => !_.isString(item))) as string[];
};

export {
  getFileConfigGlobs,
};
