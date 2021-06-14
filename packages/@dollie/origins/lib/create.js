const _ = require('lodash');

function createTemplateOrigin(name, metadata) {
  if (!_.isString(name)) {
    return null;
  }

  return {
    name,
    handler: async function(templateName, config) {
      const { getTemplateUrl, getHeaders, configPaths } = metadata;
      if (!_.isFunction(getTemplateUrl)) {
        return null;
      }
      const originConfig = _.pick(_.get(config, name) || {}, configPaths || []);
      return {
        url: await getTemplateUrl(templateName, originConfig),
        headers: _.isFunction(getHeaders) ? await getHeaders(templateName, originConfig) : {},
      };
    },
  };
};

module.exports = createTemplateOrigin;
