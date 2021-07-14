import _ from 'lodash';
import got from 'got';
import { DollieOriginHandler } from '../interfaces';

export default (async (id, config = {}, request = got) => {
  if (!id) {
    return null;
  }

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

  return {
    headers,
    url: 'https://gitlab.com/api/v4/projects/' +
      targetProject.id +
      '/repository/archive.zip' +
      (checkout ? `?sha=${checkout}` : ''),
  };
}) as DollieOriginHandler;
