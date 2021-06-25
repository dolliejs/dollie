import _ from 'lodash';
import { DollieOriginHandler } from './interfaces';

export default (async (id, config = {}) => {
  if (!id) {
    return null;
  }

  const [repository, checkout = ''] = id.split('@');

  const token = config.token || '';

  return {
    url: `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`,
    headers: token ? {
      'Authorization': `token ${token}`,
    } : {},
  };
}) as DollieOriginHandler;
