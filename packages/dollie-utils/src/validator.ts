import _ from 'lodash';

const validate = (source: string) => {
  if (!_.isString(source)) {
    return true;
  }

  const regexps = [
    /require\(.*\)/g,
    /import((\s|\n)*)\'.*\'/g,
    /import((\s|\n)*).*((\s|\n)*)from((\s|\n)*)\'.*\'/g,
    /import\(.*/g,
  ];

  for (const regexp of regexps) {
    if (regexp.test(source)) {
      return false;
    }
  }

  return true;
};

export {
  validate,
};
