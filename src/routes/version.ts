import { Hono } from 'hono';
import { fetchCompletedTimeMiddleware } from '../middlewares';
import { sanitizeText } from '../helpers/utils';
import { html } from 'hono/html';
import { Constants } from '../constants';

const app = new Hono();

export const route = app.get('/owoembed', fetchCompletedTimeMiddleware, async c => {
  c.set('fetchCompletedTime', performance.now());

  const { cf, headers } = c.req.raw;
  const rtt = cf?.clientTcpRtt ? `🏓 ${cf.clientTcpRtt} ms RTT` : '';
  const colo = (cf?.colo as string) ?? '??';
  const httpversion = (cf?.httpProtocol as string) ?? 'Unknown HTTP Version';
  const tlsversion = (cf?.tlsVersion as string) ?? 'Unknown TLS Version';
  const ip = headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'Unknown IP';
  const city = (cf?.city as string) ?? 'Unknown City';
  const region = (cf?.region as string) ?? cf?.country ?? 'Unknown Region';
  const country = (cf?.country as string) ?? 'Unknown Country';
  const asn = `AS${cf?.asn ?? '??'} (${cf?.asOrganization ?? 'Unknown ASN'})`;
  const ua = sanitizeText(headers.get('user-agent') ?? 'Unknown User Agent');

  return c.html(
    html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta content="${BRANDING_NAME}" property="og:title"/>
        <meta content="${BRANDING_NAME}" property="og:site_name"/>
        <meta content="https://cdn.discordapp.com/icons/958942151817977906/7a220767640cbedbf780767585eaa10d.png?size=96" property="og:image"/>
        <meta content="https://cdn.discordapp.com/icons/958942151817977906/7a220767640cbedbf780767585eaa10d.png?size=96" property="twitter:image"/>
        <meta content="#1E98F0" name="theme-color"/>
        <meta content="Worker release: ${RELEASE_NAME}
        
        Stats for nerds: 
        🕵️‍♂️ ${ua}
        🌐 ${ip}
        🌎 ${city}, ${region}, ${country}
        🛴 ${asn}
  
        Edge Connection:
        ${rtt} 📶 ${httpversion} 🔒 ${tlsversion} ➡ ⛅ ${colo}
        " property="og:description"/></head>
        <title>${BRANDING_NAME}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 0 20px;
          }
          h1 {
            font-size: 4em;
            font-weight: 900;
            margin-bottom: 0;
          }
          h2 {
            white-space: pre-wrap;
          }
          p {
            font-size: 10px;
            opacity: 0.3;
          }
          .cf {
            display: inline-block;
            vertical-align: middle;
            height: 48px;
            width: 48px;
          }
        </style>
      </head>
      <body>
        <h1>${BRANDING_NAME}</h1>
        <h3>A better way to embed X / Twitter posts on Discord, Telegram, and more.</h2>
        <h2>Worker release: ${RELEASE_NAME}</h2>
        <br>
        <h3>Stats for nerds:</h3>
        <h2>Edge Connection:
        ${rtt} 📶 ${httpversion} 🔒 ${tlsversion} ➡ <img class="cf" referrerpolicy="no-referrer" src="https://cdn.discordapp.com/emojis/988895299693080616.webp?size=96&quality=lossless"> {colo}</h2>
        <h2>User Agent:
        ${ua}</h2>
      </body>
    </html>`,
    200,
    {
      ...Constants.RESPONSE_HEADERS,
      'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
    }
  );
});
