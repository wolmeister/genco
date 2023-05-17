import wretch, { ConfiguredMiddleware } from 'wretch';
import QueryStringAddon from 'wretch/addons/queryString';

import { getJwt } from '../auth/jwt';

const authMiddleware: ConfiguredMiddleware = next => {
  return (url, opts) => {
    const jwt = getJwt();
    if (jwt) {
      const headers = new Headers(opts.headers);
      headers.set('Authorization', `Bearer ${jwt}`);
      return next(url, { ...opts, headers });
    }
    return next(url, opts);
  };
};

export const apiClient = wretch('/api').addon(QueryStringAddon).middlewares([authMiddleware]);
