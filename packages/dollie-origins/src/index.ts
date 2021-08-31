import githubOrigin from './handlers/github';
import gitlabOrigin from './handlers/gitlab';
import devOrigin from './handlers/dev';

export {
  githubOrigin,
  gitlabOrigin,
  devOrigin,
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
