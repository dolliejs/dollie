import {
  DollieTemplateConfig,
} from './interfaces';
import _ from 'lodash';

const getFileConfigGlobs = <T = string>(
  config: DollieTemplateConfig,
  targets: string[],
  type: string,
): T[] => {
  let files = (_.get(config, `files.${type}`) || []) as T[];
  for (const target of targets) {
    files = files.concat((_.get(config, `${target}.files.${type}`)) || [] as T[]);
  }
  return ((_.get(config, `files.${type}`) || []) as T[])
    .concat(targets.reduce((result, target) => {
      const currentTemplateFiles = (_.get(config, `extendTemplates.${target}.files.${type}`) || []) as T[];
      return result.concat(currentTemplateFiles);
    }, [] as T[]));
};

export {
  getFileConfigGlobs,
};
