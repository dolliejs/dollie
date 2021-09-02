const path = require('path');
const fs = require('fs-extra');
const getPaths = require('../utils/paths');

const clean = () => {
  const paths = getPaths();
  const cwd = path.resolve(__dirname, '..');

  const fileMap = {
    lib: './lib',
    modules: './node_modules',
    lock: './package-lock.json',
  };

  const types = process.argv[2]
    ? process.argv[2].split(',')
    : Object.keys(fileMap);

  for (const packagePath of paths) {
    for (const type of types) {
      if (!fileMap[type]) {
        continue;
      }
      const currentPath = path.resolve(cwd, packagePath, fileMap[type]);
      console.log('[CLEAN]', currentPath);
      fs.removeSync(currentPath);
    }
  }
};

clean();
