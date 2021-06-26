import {
  DollieGeneratorResult,
} from '@dollie/core/lib/interfaces';
import fs from 'fs-extra';
import path from 'path';

const writeGeneratedFiles = (data: DollieGeneratorResult) => {
  const { files = {} } = data;
  for (const pathname of Object.keys(files)) {
    const content = files[pathname];
    const dirname = pathname.split(path.sep).slice(0, -1).join(path.sep);
    const absoluteDirname = path.resolve(process.cwd(), dirname);

    if (dirname && !fs.existsSync(absoluteDirname)) {
      fs.mkdirpSync(absoluteDirname);
    }

    fs.writeFileSync(path.resolve(process.cwd(), pathname), content);
  }
};

export {
  writeGeneratedFiles,
};
