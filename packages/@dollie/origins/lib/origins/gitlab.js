const _ = require('lodash');
const got = require('got');

const createTemplateOrigin = require('../create');

module.exports = createTemplateOrigin('gitlab', {
  configPaths: ['token', 'host', 'port', 'protocol'],
  getTemplateUrl: async function(name, config) {
    if (!_.isString(name)) {
      return '';
    }

    const {
      protocol = 'https',
      host = 'gitlab.com',
      token = '',
    } = config;

    const [repository, checkout = ''] = name.split('@');
    const [repositoryOwner] = name.split('/');

    const res = await got(`${protocol}://${host}/api/v4/users/${repositoryOwner}/projects`, {
      timeout: 10000,
      retry: 3,
      headers: token ? { token } : {},
    });

    const projects = (JSON.parse(res.body || '[]') || []);
    const targetProject = projects.filter((project) => project.path_with_namespace === repository)[0];

    if (!targetProject) { return ''; }

    return `https://gitlab.com/api/v4/projects/${targetProject.id}/repository/archive.zip${checkout ? `?sha=${checkout}` : ''}`;
  },
  getHeaders: async function(name, config) {
    const {
      token = '',
    } = config;
    return { token };
  },
});
