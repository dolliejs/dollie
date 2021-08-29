import { OriginHandler } from '../interfaces';

export default (async (id, config = {}, context) => {
  if (!id) {
    return null;
  }

  const {
    lodash: _,
    request,
  } = context;

  let cache = false;

  const [repository, checkout = ''] = id.split('@');

  if (!repository) {
    return null;
  }

  let sha = '';

  try {
    let branchRequestBody = (await request(
      'https://api.github.com/repos/' +
      repository +
      `/branches/${checkout || 'master'}`,
    )).body;

    sha = _.get(JSON.parse(branchRequestBody), 'commit.sha') || '';
  } catch (e) {
    if (!sha || sha.length === 0) {
      const commitsRequestBody = (await request(
        'https://api.github.com/repos/' +
        repository +
        '/commits',
      )).body;

      if (_.isString(commitsRequestBody)) {
        const commits = JSON.parse(commitsRequestBody);

        if (_.isArray(commits)) {
          sha = _.get(_.first(commits), 'sha') || '';
        }
      }
    }
  }

  if (sha.length > 0) {
    cache = true;
  }

  const token = config.token || '';

  return {
    url: 'https://api.github.com/repos/' +
      repository +
      '/zipball' +
      (sha ? `/${sha}` : ''),
    headers: token
      ? {
        'Authorization': `token ${token}`,
      }
      : {},
    cache,
  };
}) as OriginHandler;
