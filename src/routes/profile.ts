/* Pass through profile requests to Twitter.
   We don't currently have custom profile cards yet,
   but it's something we might do. Maybe. **/

import { Hono } from 'hono';
import { Constants } from '../constants';
import {
  fetchCompletedTimeMiddleware,
  getBaseRedirectUrlsMiddleware,
  inputFlagsMiddleware
} from '../middlewares';
import { Strings } from '../strings';

import { handleProfile } from '../user';
const app = new Hono();

export const route = app.get(
  '/:handle',
  fetchCompletedTimeMiddleware,
  inputFlagsMiddleware,
  getBaseRedirectUrlsMiddleware,
  async c => {
    const { handle } = c.req.param();
    const userAgent = c.req.header('User-Agent') ?? '';

    /* User Agent matching for embed generators, bots, crawlers, and other automated
     tools. It's pretty all-encompassing. Note that Firefox/92 is in here because
     Discord sometimes uses the following UA:

     Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0

     I'm not sure why that specific one, it's pretty weird, but this edge case ensures
     stuff keeps working.

     On the very rare off chance someone happens to be using specifically Firefox 92,
     the http-equiv="refresh" meta tag will ensure an actual human is sent to the destination. */
    const isBotUA = userAgent.match(Constants.BOT_UA_REGEX) !== null;

    /* If not a valid screen name, we redirect to project GitHub */
    if (handle.match(/\w{1,15}/gi)?.[0] !== handle) {
      return Response.redirect(Constants.REDIRECT_URL, 302);
    }
    const username = handle.match(/\w{1,15}/gi)?.[0] as string;
    /* Check if request is to api.fxtwitter.com */
    if (Constants.API_HOST_LIST.includes(new URL(c.req.url).hostname)) {
      console.log('JSON API request');
      // c.var.flags.api = true;
      c.set('inputFlags', { ...c.var.inputFlags, api: true });
    }

    /* Direct media or API access bypasses bot check, returning same response regardless of UA */
    if (isBotUA || c.var.inputFlags.api) {
      if (isBotUA) {
        console.log(`Matched bot UA ${userAgent}`);
      } else {
        console.log('Bypass bot check');
      }

      /* This throws the necessary data to handleStatus (in status.ts) */
      const profileResponse = await handleProfile(
        username,
        userAgent,
        c.var.inputFlags,
        c.event as FetchEvent
      );

      /* Complete responses are normally sent just by errors. Normal embeds send a `text` value. */
      if (profileResponse.response) {
        console.log('handleProfile sent response');
        return profileResponse.response;
      } else if (profileResponse.text) {
        console.log('handleProfile sent embed');
        /* TODO This check has purpose in the original handleStatus handler, but I'm not sure if this edge case can happen here */
        /* Check for custom redirect */

        if (!isBotUA) {
          /* Do not cache if using a custom redirect */
          const cacheControl = c.var.baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

          return new Response(null, {
            status: 302,
            headers: {
              Location: `${c.var.baseUrl}/${handle}`,
              ...(cacheControl ? { 'cache-control': cacheControl } : {})
            }
          });
        }

        let headers = Constants.RESPONSE_HEADERS;

        if (profileResponse.cacheControl) {
          headers = {
            ...headers,
            'cache-control':
              c.var.baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : profileResponse.cacheControl
          };
        }

        /* Return the response containing embed information */
        return new Response(profileResponse.text, {
          headers: headers,
          status: 200
        });
      } else {
        /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
        return new Response(Strings.ERROR_UNKNOWN, {
          headers: { ...Constants.RESPONSE_HEADERS, 'cache-control': 'max-age=0' },
          status: 500
        });
      }
    } else {
      /* A human has clicked a fxtwitter.com/:screen_name link!
        Obviously we just need to redirect to the user directly.*/
      console.log('Matched human UA', userAgent);

      /* Do not cache if using a custom redirect */
      const cacheControl = c.var.baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${c.var.baseUrl}/${handle}`,
          ...(cacheControl ? { 'cache-control': cacheControl } : {})
        }
      });
    }
  }
);
