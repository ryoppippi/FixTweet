import { Hono } from 'hono';
import { Constants } from '../constants';
import { fetchCompletedTimeMiddleware } from '../middlewares';
import { Strings } from '../strings';
import { sanitizeText } from '../helpers/utils';

const app = new Hono();

export const route = app.get('/owoembed', fetchCompletedTimeMiddleware, async c => {
  /* Query params */

  let url = c.req.query('url');

  /* Check that origin either does not exist or is in our domain list */
  const origin = c.req.header('origin');

  if (origin && !Constants.STANDARD_DOMAIN_LIST.includes(new URL(origin).hostname)) {
    return c.html(
      Strings.MESSAGE_HTML(
        `Failed to set base redirect: Your request seems to be originating from another domain, please open this up in a new tab if you are trying to set your base redirect.`
      ),
      403,
      Constants.RESPONSE_HEADERS
    );
  }

  if (!url) {
    /* Remove redirect URL */
    return c.html(
      Strings.MESSAGE_HTML(
        `Your base redirect has been cleared. To set one, please pass along the <code>url</code> parameter.`
      ),
      200,
      {
        'set-cookie': `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`,
        'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`,
        ...Constants.RESPONSE_HEADERS
      }
    );
  }

  try {
    new URL(url);
  } catch (e) {
    try {
      new URL(`https://${url}`);
    } catch (e) {
      /* URL is not well-formed, remove */
      console.log('Invalid base redirect URL, removing cookie before redirect');

      return c.html(
        Strings.MESSAGE_HTML(
          `Your URL does not appear to be well-formed. Example: ?url=https://nitter.net`
        ),
        200,
        {
          'set-cookie': `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`,
          'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`,
          ...Constants.RESPONSE_HEADERS
        }
      );
    }

    url = `https://${url}`;
  }

  /* Set cookie for url */
  return c.html(
    Strings.MESSAGE_HTML(
      `Successfully set base redirect, you will now be redirected to ${sanitizeText(
        url
      )} rather than ${Constants.TWITTER_ROOT}`
    ),
    200,
    {
      'set-cookie': `base_redirect=${url}; path=/; max-age=63072000; secure; HttpOnly`,
      'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`,
      ...Constants.RESPONSE_HEADERS
    }
  );
});
