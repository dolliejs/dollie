import got, {
  Got,
  Options as GotOptions,
  HTTPError as GotHTTPError,
} from 'got';
import _ from 'lodash';
import tunnel from 'tunnel';
import { RequestOptions } from '../interfaces';
import { URL } from 'url';
import { HTTPError } from '../errors';

const generateGotOptions = (options: RequestOptions): GotOptions => {
  const {
    httpProxyUrl = '',
    httpProxyAuth = '',
    ...restOptions
  } = options;

  const gotOptions = _.clone(restOptions) as GotOptions;

  if (httpProxyUrl) {
    const url = new URL(httpProxyUrl);
    const { hostname: host, port } = url;
    const proxy: tunnel.ProxyOptions = {
      host,
      port: parseInt(port, 10),
    };

    if (httpProxyAuth) {
      proxy.proxyAuth = httpProxyAuth;
    }

    gotOptions.agent = {
      http: tunnel.httpOverHttp({ proxy }),
      https: tunnel.httpsOverHttp({ proxy }),
    };
  }

  gotOptions.hooks = {
    beforeError: [
      (e) => {
        const error = e as GotHTTPError;
        const reason = error?.response?.statusMessage || '';
        const httpCode = _.snakeCase(reason).toUpperCase();
        const statusCode = error?.response?.statusCode;
        return new HTTPError(httpCode, statusCode, reason) as any;
      },
    ],
  };

  return gotOptions;
};

const createHttpInstance = (options: RequestOptions): Got => {
  return got.extend(generateGotOptions(options));
};

export {
  generateGotOptions,
  createHttpInstance,
};
