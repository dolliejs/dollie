const _ = require('lodash');
const { InvalidInputError } = require('./errors');
const { githubOrigin, gitlabOrigin } = require('@dollie/origins');

function Generator(name, config) {
  this.templateName = '';
  this.templateOrigin = '';

  let origins = [githubOrigin, gitlabOrigin];

  this.initialize = async function() {
    const { customOrigins = [] } = config;
    origins = origins.concat(customOrigins);
    if (_.isString(name)) {
      [this.templateName, this.templateOrigin] = name.split(':');
    }
  };

  this.checkInputs = function() {
    if (!name || !_.isString(name)) {
      throw new InvalidInputError('name should be a string');
    }
  };
}

module.exports = Generator;
