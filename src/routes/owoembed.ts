/* Oembeds (used by Discord to enhance responses) 
Yes, I actually made the endpoint /owoembed. Deal with it. **/

import { Hono } from 'hono';
import { Constants } from '../constants';
import { fetchCompletedTimeMiddleware } from '../middlewares';
import { Strings } from '../strings';
import motd from '../../motd.json';

const app = new Hono();

export const route = app.get('/owoembed', fetchCompletedTimeMiddleware, async c => {
  c.set('fetchCompletedTime', performance.now());

  console.log('oembed hit!');

  /* Fallbacks */
  const {
    text = 'Twitter',
    author = 'jack',
    status = '20',
    deprecated = 'false'
    // useXbranding = false
  } = c.req.query();

  const random = Math.floor(Math.random() * Object.keys(motd).length);
  const [name, url] = Object.entries(motd)[random];

  const test = {
    author_name: text,
    author_url: `${Constants.TWITTER_ROOT}/${encodeURIComponent(author)}/status/${status}`,
    /* Change provider name if tweet is on deprecated domain. */
    provider_name: deprecated === 'true' ? Strings.DEPRECATED_DOMAIN_NOTICE_DISCORD : name,
    /*useXbranding ? name : Strings.X_DOMAIN_NOTICE*/
    provider_url: url,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'link',
    version: '1.0'
  };
  /* Stringify and send it on its way! */
  return c.jsonT(test, 200, {
    ...Constants.RESPONSE_HEADERS,
    'content-type': 'application/json'
  });
});
