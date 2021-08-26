import { Answers } from 'inquirer';
import _ from 'lodash';
import { EXTEND_TEMPLATE_PREFIX } from '../constants';
import { ParsedProps } from '../interfaces';

const answersParser = (answers: Answers) => {
  return Object.keys(answers).reduce((result, currentKey) => {
    const currentProp = answers[currentKey];
    if (currentKey.startsWith('$EXTEND$')) {
      if (_.isArray(currentProp)) {
        result.pendingExtendTemplateLabels = _
          .uniq(result.pendingExtendTemplateLabels.concat(currentProp))
          .filter((extendTemplateName) => extendTemplateName !== 'null');
      }
      if (_.isString(currentProp) && currentProp !== 'null') {
        result.pendingExtendTemplateLabels = _.uniq(
          result.pendingExtendTemplateLabels.concat(currentProp),
        );
      }
    } else if (currentKey.startsWith('$EXTEND:')) {
      if (_.isBoolean(currentProp) && currentProp) {
        const extendTemplateIdChars = [];
        for (const char of currentKey.slice(EXTEND_TEMPLATE_PREFIX.length + 1)) {
          if (char !== '$') {
            extendTemplateIdChars.push(char);
          } else {
            break;
          }
        }
        if (extendTemplateIdChars.length > 0) {
          result.pendingExtendTemplateLabels = _.uniq(
            result.pendingExtendTemplateLabels.concat(extendTemplateIdChars.join('')),
          );
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
