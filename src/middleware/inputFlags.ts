import type { MiddlewareHandler } from 'hono';

/** Fetch completed time middleware */
export const inputFlagsMiddleware: MiddlewareHandler<{
  Variables: {
    inputFlags: InputFlags;
  };
}> = async (c, next) => {
  await next();
};
