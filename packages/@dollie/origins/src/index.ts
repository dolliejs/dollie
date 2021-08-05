import githubOrigin from './handlers/github';
import gitlabOrigin from './handlers/gitlab';

export {
  githubOrigin,
  gitlabOrigin,
};

export {
  OriginConfig,
  OriginHeaders,
  OriginInfo,
  OriginHandler,
  Origin,
  OriginMap,
} from './interfaces';

export {
  loadOrigins,
} from './loader';
