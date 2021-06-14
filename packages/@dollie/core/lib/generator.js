const _ = require('lodash');
const {
  InvalidInputError,
  ContextError,
} = require('./errors');
const { githubOrigin, gitlabOrigin } = require('@dollie/origins');
const { Volume } = require('memfs');

function Generator(name, config) {
  this.templateName = '';
  this.templateOrigin = '';

  let origins = [githubOrigin, gitlabOrigin];
  const virtualVolume = new Volume();

  this.checkInputs = function() {
    if (!name || !_.isString(name)) {
      throw new InvalidInputError('name should be a string');
    }
  };

  this.initialize = async function() {
    const { customOrigins = [] } = config;
    origins = origins.concat(customOrigins);
    if (_.isString(name)) {
      [this.templateName, this.templateOrigin = 'github'] = name.split(':');
    }
  };

  this.checkContext = function() {
    const originIds = origins.map((origin) => origin.name);
    const uniqueOriginIds = _.uniq(originIds);
    if (originIds.length > uniqueOriginIds.length) {
      throw new ContextError('duplicated origin names');
    }
  };

  this.loadTemplate = async function() {
    const origin = origins.find((origin) => origin.name === this.templateOrigin);

    if (!origin) {
      throw new ContextError(`origin name \`${this.templateOrigin}\` not found`);
    }

    if (!_.isFunction(origin.handler)) {
      throw new ContextError(`origin \`${this.templateOrigin}\` has a wrong handler type`);
    }

    const { url, headers } = await origin.handler(
      this.templateName,
      _.get(config, `origins.${this.templateOrigin}`),
    );

    if (!_.isString(url) || !url) {
      throw new ContextError(`origin \`${this.templateOrigin}\` url parsed with errors`);
    }
  };
}

module.exports = Generator;
