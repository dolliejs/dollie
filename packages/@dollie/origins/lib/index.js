const createTemplateOrigin = require('./create');
const githubOrigin = require('./origins/github');
const gitlabOrigin = require('./origins/gitlab');

module.exports = {
  createTemplateOrigin,
  githubOrigin,
  gitlabOrigin,
};
