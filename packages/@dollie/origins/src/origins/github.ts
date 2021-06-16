import _ from 'lodash';
import createTemplateOrigin from '../create';

export default createTemplateOrigin('github', {
  configPaths: ['token'],
  getTemplateUrl: async (name) => {
    if (!_.isString(name)) {
      return '';
    }

    const [repository, checkout = ''] = name.split('@');

    return `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`;
  },
});
