import type { MiddlewareHandler } from 'hono';
import { env } from 'hono/adapter';

/** Fetch completed time middleware */
export const fetchCompletedTimeMiddleware: MiddlewareHandler<{
  Variables: {
    fetchCompletedTime: number;
  };
}> = async (c, next) => {
  if (c.var.fetchCompletedTime == null) {
    c.set('fetchCompletedTime', 0);
  }
  await next();
};
