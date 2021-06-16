import _ from 'lodash';
import { DollieOrigin, DollieOriginMetadata } from './interfaces';

const createTemplateOrigin = (name: string, metadata: DollieOriginMetadata): DollieOrigin => {
  if (!_.isString(name)) {
    return null;
  }

  return {
    name,
    handler: async (templateName, config) => {
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

export default createTemplateOrigin;
