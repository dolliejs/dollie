import got from 'got';
import _ from 'lodash';
import {
    DollieOrigin,
    DollieOriginMap,
} from './interfaces';
import fs from 'fs';
import requireFromString from 'require-from-string';
import { githubOrigin, gitlabOrigin } from '.';
import path from 'path';

const isUrl = (url: string) => {
    return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(url);
};

const loadOrigins = async (config: DollieOriginMap): Promise<DollieOrigin[]> => {
    const result: DollieOrigin[] = [];

    for (const name of Object.keys(config)) {
        const pathnameOrHandler = config[name];

        if (_.isFunction(pathnameOrHandler)) {
            result.push({
                name,
                handler: pathnameOrHandler,
            });
        } else if (_.isString(pathnameOrHandler)) {
            try {
                let content: string;

                if (isUrl(pathnameOrHandler)) {
                    content = (await got(pathnameOrHandler)).body;
                } else {
                    const originHandlerFilePathname = path.resolve(process.cwd(), pathnameOrHandler);
                    if (!fs.existsSync(originHandlerFilePathname)) {
                        continue;
                    }
                    const stat = fs.statSync(originHandlerFilePathname);
                    if (stat.isFile()) {
                        content = fs.readFileSync(originHandlerFilePathname).toString();
                    }
                }

                if (!content || !_.isString(content)) {
                    continue;
                }

                const handlerFunc = requireFromString(content);

                if (!_.isFunction(handlerFunc)) { continue; }

                result.push({
                    name,
                    handler: handlerFunc,
                });
            } catch {
                continue;
            }
        } else {
            continue;
        }
    }

    return [
        {
            name: 'github',
            handler: githubOrigin,
        },
        {
            name: 'gitlab',
            handler: gitlabOrigin,
        },
    ].concat(result);
};

export {
    loadOrigins,
};
