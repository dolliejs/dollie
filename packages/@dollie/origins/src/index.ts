import githubOrigin from './handlers/github';
import gitlabOrigin from './handlers/gitlab';

export {
  githubOrigin,
  gitlabOrigin,
};

export {
  OriginConfig,
  DollieOriginHeaders,
  DollieOriginInfo,
  DollieOriginHandler,
  Origin,
  DollieOriginMap,
} from './interfaces';

export {
  loadOrigins,
} from './loader';
