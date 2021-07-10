import fs from 'fs-extra';
import {
    DEFAULT_CONFIG,
    CONFIG_DIR,
    SYSTEM_CONFIG_PATHNAME,
} from './constants';

const initializeConfig = () => {
    const writeSystemConfig = () => {
        fs.writeFileSync(SYSTEM_CONFIG_PATHNAME, JSON.stringify(DEFAULT_CONFIG, null, 2));
    };

    const dirExistence = fs.existsSync(CONFIG_DIR);

    if (!dirExistence) {
        fs.mkdirpSync(CONFIG_DIR);
    }

    const dirStat = fs.statSync(CONFIG_DIR);

    if (!dirStat.isDirectory()) {
        try {
            fs.removeSync(CONFIG_DIR);
            fs.mkdirpSync(CONFIG_DIR);
        } catch {}
    }

    const systemConfigFileExistence = fs.existsSync(SYSTEM_CONFIG_PATHNAME);

    if (!systemConfigFileExistence) {
        writeSystemConfig();
    }

    const systemConfigFileStat = fs.statSync(SYSTEM_CONFIG_PATHNAME);

    if (!systemConfigFileStat.isFile()) {
        fs.removeSync(SYSTEM_CONFIG_PATHNAME);
        writeSystemConfig();
    }
};

export {
    initializeConfig,
};
