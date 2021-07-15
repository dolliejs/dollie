import { DollieOriginHandler } from '../interfaces';

export default (async (id, config = {}, request, deps) => {
  if (!id) {
    return null;
  }

  const {
    lodash: _,
  } = deps;

  let cache = false;

  let [repository, checkout = ''] = id.split('@');

  if (!repository) {
    return null;
  }

  if (!checkout) {
    try {
      let branchRequestBody = (await request(
        'https://api.github.com/repos/' +
        repository +
        '/branches/master',
      )).body;

      if (!branchRequestBody) {
        const commitsRequestBody = (await request(
          'https://api.github.com/repos/' +
          repository +
          '/commits',
        )).body;

        if (_.isString(commitsRequestBody)) {
          const commits = JSON.parse(commitsRequestBody);

          if (_.isArray(commits)) {
            checkout = _.get(_.first(commits), 'sha') || '';
          }
        }
      } else {
        checkout = _.get(JSON.parse(branchRequestBody), 'commit.sha') || '';
      }

      if (checkout.length > 0) {
        cache = true;
      }
    } catch {}
  }

  const token = config.token || '';

  return {
    url: 'https://api.github.com/repos/' +
      repository +
      '/zipball' +
      (checkout ? `/${checkout}` : ''),
    headers: token
      ? {
        'Authorization': `token ${token}`,
      }
      : {},
    cache,
  };
}) as DollieOriginHandler;
