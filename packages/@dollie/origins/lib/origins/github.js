const _ = require('lodash');
const createTemplateOrigin = require('../create');

module.exports = createTemplateOrigin('github', {
  configPaths: ['token'],
  getTemplateUrl: async function(name) {
    if (!_.isString(name)) {
      return '';
    }

    const [repository, checkout = ''] = name.split('@');

    return `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`;
  },
});
