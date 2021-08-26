import _ from 'lodash';
import minimatch from 'minimatch';

class GlobMatcher {
  public constructor(
    private readonly patterns: Record<string, string[]>,
  ) {}

  public match(pathname: string, type: string) {
    const currentPatternsList = this.patterns[type] || [];

    if (!_.isArray(currentPatternsList) || currentPatternsList.length === 0) {
      return false;
    }

    for (const pattern of currentPatternsList) {
      if (minimatch(pathname, pattern)) {
        return true;
      }
    }

    return false;
  }
}

export {
  GlobMatcher,
};
