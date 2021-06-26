import os from 'os';
import path from 'path';

export const HOME_DIR = os.homedir();
export const CONFIG_FOLDER_NAME = '.dollie';
export const CONFIG_DIR = path.resolve(HOME_DIR, CONFIG_FOLDER_NAME);
export const SYSTEM_CONFIG_FILENAME = 'config.json';

export const SYSTEM_CONFIG_PATHNAME = path.resolve(CONFIG_DIR, SYSTEM_CONFIG_FILENAME);
export const DEFAULT_CONFIG = {};
