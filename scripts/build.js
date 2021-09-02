const getPaths = require('../utils/paths');
const path = require('path');
const { program } = require('commander');
const {
  spawn,
  spawnSync,
} = require('child_process');
const fs = require('fs-extra');

const build = (watch = false, selectedPackages = []) => {
  const paths = getPaths();
  const packages = paths.map((currentPath) => {
    const {
      name,
      dependencies = {},
      devDependencies = {},
    } = require(path.resolve(currentPath, 'package.json'));

    return {
      pathname: currentPath,
      name,
      dependencies: Object.keys(dependencies).concat(Object.keys(devDependencies)),
    };
  });

  const projectPackages = packages.map((package) => {
    const {
      name,
      pathname,
      dependencies,
    } = package;

    return {
      name,
      pathname,
      dependencies: dependencies.filter((dependencyName) => {
        return packages.findIndex((package) => dependencyName === package.name) !== -1;
      }),
    };
  }).sort((previousPackage, nextPackage) => {
    if (nextPackage.dependencies.findIndex((dependencyName) => dependencyName === previousPackage.name) !== -1) {
      return -1;
    } else if (previousPackage.dependencies.findIndex((dependencyName) => dependencyName === nextPackage.name) !== -1) {
      return 1;
    } else {
      return 0;
    }
  });

  for (const projectPackage of projectPackages) {
    const {
      name,
      pathname,
    } = projectPackage;

    if (selectedPackages.length > 0 && selectedPackages.indexOf(name) === -1) {
      continue;
    }

    console.log(`[BUILD]${watch ? '[WATCH]' : ''}`, name);

    if (!watch) {
      fs.removeSync(path.resolve(pathname, './lib'));
    }

    const execute = watch ? spawn : spawnSync;

    execute('tsc', (watch ? ['--watch'] : []), {
      cwd: pathname,
      stdio: 'inherit',
    });
  }
};

program
  .option('-w, --watch', 'watch file changes')
  .option('-p, --packages <packages...>', 'select packages to build')
  .action(({ watch = false, packages = [] }) => {
    build(watch, packages);
  });

program.parse(process.argv);
