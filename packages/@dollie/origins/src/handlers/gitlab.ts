import { DollieOriginHandler } from '../interfaces';

export default (async (id, config = {}, request, deps) => {
  if (!id) {
    return null;
  }

  const {
    lodash: _,
  } = deps;

  let cache = false;
  let sha = '';

  const {
    protocol = 'https',
    host = 'gitlab.com',
    token = '',
  } = config;

  const [repository, checkout = ''] = id.split('@');
  const [repositoryOwner] = id.split('/');
  const headers = token
    ? {
      'Private-Token': token,
    }
    : {};

  const res = await request(
    `${protocol}://${host}/api/v4/users/${repositoryOwner}/projects`,
    {
      timeout: 10000,
      retry: 3,
      headers,
    },
  );

  const projects = JSON.parse(res.body || '[]') || [];
  const targetProject = projects.filter((project) => {
    return project.path_with_namespace === repository;
  })[0];

  if (!targetProject) { return null; }

  const projectId = targetProject.id;

  try {
    const commitsRequestURL = protocol +
      '://' +
      host +
      '/api/v4/projects/' +
      projectId +
      '/repository/commits';

    let commitsRequestBody = (await request(`${commitsRequestURL}?ref=${checkout || 'master'}`)).body;

    if (!_.isString(commitsRequestBody) || commitsRequestBody === '[]') {
      commitsRequestBody = (await request('commitsRequestURL')).body;
    }

    sha = _.get(_.first(JSON.parse(commitsRequestBody)), 'id') || '';

    if (sha.length > 0) {
      cache = true;
    }
  } catch {}

  return {
    headers,
    url: 'https://gitlab.com/api/v4/projects/' +
      projectId +
      '/repository/archive.zip' +
      (sha ? `?sha=${sha}` : ''),
    cache,
  };
}) as DollieOriginHandler;
