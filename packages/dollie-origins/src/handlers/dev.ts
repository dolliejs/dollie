import fs from 'fs-extra';
import { OriginHandler } from '../interfaces';
import _ from 'lodash';

export default (async (id, config = {}, context) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot use dev origin when current environment is not `development`');
  }

  const templatePathname = _.get(config, 'path');

  if (!templatePathname) {
    throw new Error(
      'A value for parameter `path` should be specified for current origin handler, but got `' +
      typeof templatePathname +
      '`',
    );
  }

  if (!fs.existsSync(templatePathname)) {
    throw new Error(
      'Template does not exist in: ' + templatePathname,
    );
  }

  if (!fs.statSync(templatePathname).isDirectory()) {
    throw new Error(
      'Template path ' + templatePathname + ' is not a directory',
    );
  }

  // TODO: read zip file

  return {
    // buffer:
    cache: false,
  };
}) as OriginHandler;
