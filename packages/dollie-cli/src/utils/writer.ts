import {
  GeneratorResult,
} from '@dollie/core/lib/interfaces';
import fs from 'fs-extra';
import path from 'path';

const writeGeneratedFiles = (data: GeneratorResult, projectName: string) => {
  const { files = { } } = data;
  const destinationPathname = path.resolve(process.cwd(), projectName);

  if (
    fs.existsSync(destinationPathname) &&
    !fs.statSync(destinationPathname).isDirectory()
  ) {
    fs.removeSync(destinationPathname);
  }

  if (!fs.existsSync(destinationPathname)) {
    fs.mkdirpSync(destinationPathname);
  }

  for (const _pathname of Object.keys(files)) {
    const content = files[_pathname];
    // fix: window os resolve a different pathname with the last sep is /
    // so just prehandle it by using path.resolve
    const pathname = path.resolve(destinationPathname, _pathname);
    const dirname = pathname.split(path.sep).slice(0, -1).join(path.sep);
    const absoluteDirname = path.resolve(destinationPathname, dirname);

    if (dirname && !fs.existsSync(absoluteDirname)) {
      fs.mkdirpSync(absoluteDirname);
    }

    fs.writeFileSync(path.resolve(destinationPathname, pathname), content);
  }
};

export {
  writeGeneratedFiles,
};
