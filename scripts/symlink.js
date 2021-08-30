const path = require('path');
const fs = require('fs-extra');
const {
  packages = [],
} = require('../lerna.json');
const glob = require('glob');
const _ = require('lodash');

const symlink = () => {
  const BASE_DIR = path.resolve(__dirname, '..');
  const PROCESS_DIR = path.dirname(process.execPath);
  const action = process.argv[2] || 'create';

  const packagePaths = packages.reduce((result, currentPattern) => {
    return result.concat(glob.sync(currentPattern, {
      cwd: BASE_DIR,
    }));
  }, []).map((packagePathname) => path.resolve(BASE_DIR, packagePathname));

  for (const packagePath of packagePaths) {
    const packageJson = require(path.resolve(packagePath, 'package.json'));
    const bin = _.get(packageJson, 'bin') || {};

    for (const binName of Object.keys(bin)) {
      const targetPathname = path.resolve(packagePath, bin[binName]);
      const symlinkPathname = path.resolve(PROCESS_DIR, binName);

      if (action === 'create') {
        if (fs.existsSync(symlinkPathname)) {
          console.log('[SYMLINK][CREATE] skip', `${targetPathname} -> ${symlinkPathname}`);
          continue;
        }

        console.log('[SYMLINK][CREATE]', `${targetPathname} -> ${symlinkPathname}`);
        fs.symlinkSync(targetPathname, symlinkPathname);
      } else if (action === 'remove') {
        console.log('[SYMLINK][REMOVE]', symlinkPathname);
        fs.removeSync(symlinkPathname);
      }
    }
  }
};

symlink();
