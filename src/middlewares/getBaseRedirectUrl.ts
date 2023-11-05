import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { Constants } from '../constants';

/** Fetch completed time middleware */
export const getBaseRedirectUrlsMiddleware: MiddlewareHandler<{
  Variables: {
    baseUrl: string;
  };
}> = async (c, next) => {
  const baseRedirect = getCookie(c, 'base_redirect');

  c.set('baseUrl', Constants.TWITTER_ROOT);
  if (baseRedirect != null) {
    console.log('Found base redirect', baseRedirect);

    if (URL.canParse(baseRedirect)) {
      c.set('baseUrl', baseRedirect.endsWith('/') ? baseRedirect.slice(0, -1) : baseRedirect);
    }

    await next();
  }
};
