import fs from 'fs';
import _ from 'lodash';

export const readJson = (pathname: string, key?: string): any => {
  let config: Record<string, any>;

  if (
    !fs.existsSync(pathname) ||
    !fs.statSync(pathname).isFile()
  ) {
    config = {};
  }

  try {
    const content = fs.readFileSync(pathname).toString();
    config = JSON.parse(content);
  } catch {
    config = {};
  }

  return (
    key && _.isString(key)
      ? _.get(config, key)
      : config
  );
};
