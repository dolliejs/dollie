import { Answers } from 'inquirer';
import _ from 'lodash';
import { ParsedProps } from './interfaces';

const answersParser = (answers: Answers) => {
  return Object.keys(answers).reduce((result, currentKey) => {
    const currentProp = answers[currentKey];
    if (currentKey === '$EXTEND$') {
      if (_.isArray(currentProp)) {
        result.pendingExtendTemplateLabels = _.uniq(result.pendingExtendTemplateLabels.concat(currentProp))
          .filter((extendTemplateName) => extendTemplateName !== 'null');
      }
      if (_.isString(currentProp) && currentProp !== 'null') {
        result.pendingExtendTemplateLabels = _.uniq(result.pendingExtendTemplateLabels.concat(currentProp));
      }
    } else if (currentKey.startsWith('$EXTEND:')) {
      if (_.isBoolean(currentProp) && currentProp) {
        const currentExtend = /^\$EXTEND\:(.*)?\$$/.exec(currentKey)[1];
        if (currentExtend) {
          result.pendingExtendTemplateLabels = _.uniq(result.pendingExtendTemplateLabels.concat(currentExtend));
        }
      }
    } else {
      result.props[currentKey] = currentProp;
    }
    return result;
  }, {
    props: {},
    pendingExtendTemplateLabels: [],
  } as ParsedProps);
};

export {
  answersParser,
};
