import { Answers } from 'inquirer';
import _ from 'lodash';
import { ParsedProps } from './interfaces';

const answersParser = (answers: Answers) => {
  return Object.keys(answers).reduce((result, currentKey) => {
    const currentProp = answers[currentKey];
    if (currentKey === '$EXTEND$') {
      if (_.isArray(currentProp)) {
        result.extendedTemplates = _.uniq(result.extendedTemplates.concat(currentProp));
      }
      if (_.isString(currentProp)) {
        result.extendedTemplates = _.uniq(result.extendedTemplates.concat(currentProp));
      }
    } else if (currentKey.startsWith('$EXTEND:')) {
      if (_.isBoolean(currentProp) && currentProp) {
        const currentExtend = /^\$EXTEND\:(.*)?\$$/.exec(currentKey)[1];
        if (currentExtend) {
          result.extendedTemplates = _.uniq(result.extendedTemplates.concat(currentExtend));
        }
      }
    } else {
      result.props[currentKey] = currentProp;
    }
    return result;
  }, {
    props: {},
    extendedTemplates: [],
  } as ParsedProps);
};

export {
  answersParser,
};
