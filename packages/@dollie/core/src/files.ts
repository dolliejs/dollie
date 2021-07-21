import {
  DeleteConfigHandler,
  TemplateConfig,
} from './interfaces';
import _ from 'lodash';

/**
 * read config file and accumulate all file patterns
 * @param {TemplateConfig} config
 * @param {string[]} targets
 * @param {string} type
 * @returns
 */
const getFileConfigGlobs = async (
  config: TemplateConfig,
  // targeted extend templates
  targets: string[],
  // enum: `merge` or `delete`
  type: string,
): Promise<string[]> => {
  let patterns = (
    _.get(config, `files.${type}`) || []
  ) as (string | DeleteConfigHandler)[];

  for (const target of targets) {
    patterns = patterns.concat(
      (
        _.get(config, `extendTemplates.${target}.files.${type}`) || []
      ) as (string | DeleteConfigHandler)[],
    );
  }

  let result: string[] = [];

  for (const pattern of patterns) {
    if (_.isString(pattern)) {
      result.push(pattern);
    } else if (_.isFunction(pattern)) {
      // get patterns from functional param
      const returnValue = await pattern(config, targets);

      if (_.isArray(returnValue) && returnValue.length > 0) {
        result = result.concat(returnValue);
      } else if (_.isString(returnValue)) {
        result.push(returnValue);
      }
    }
  }

  return _.uniq(
    result
      .filter((item) => !!item)
      .filter((item) => _.isString(item)),
  ) as string[];
};

export {
  getFileConfigGlobs,
};
