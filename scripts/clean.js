const glob = require('glob');
const path = require('path');
const { packages = [] } = require(path.resolve(__dirname, '../lerna.json'));
const fs = require('fs-extra');

const clean = () => {
  const cwd = path.resolve(__dirname, '..');
  const paths = packages.reduce((result, pattern) => {
    const paths = glob.sync(pattern, {
      cwd,
    });
    return result.concat(paths);
  }, []);

  for (const packagePath of paths) {
    const libPath = path.resolve(cwd, packagePath, './lib');
    const nodeModulesPath = path.resolve(cwd, packagePath, './node_modules');
    const lockFilePath = path.resolve(cwd, packagePath, './package-lock.json');
    console.log('[CLEAN] ', packagePath);
    fs.removeSync(libPath);
    fs.removeSync(nodeModulesPath);
    fs.removeSync(lockFilePath);
  }
};

clean();
