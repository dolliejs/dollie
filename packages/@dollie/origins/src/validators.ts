import _ from 'lodash';

export const validateOriginHandlerSource = (source: string) => {
  if (!source || !_.isString(source)) {
    return false;
  }

  const reg = /require\(\'.*\'\)/g;

  const matches = source.match(reg) || [];

  return matches.length === 0;
};
