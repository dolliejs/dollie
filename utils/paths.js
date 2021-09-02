const path = require('path');
const glob = require('glob');

module.exports = () => {
  const { packages = [] } = require(path.resolve(__dirname, '../lerna.json'));

  const paths = packages.reduce((result, pattern) => {
    const paths = glob.sync(pattern, {
      cwd: path.resolve(__dirname, '..'),
    });
    return result.concat(paths);
  }, []);

  return paths;
};
