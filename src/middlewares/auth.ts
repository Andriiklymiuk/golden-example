import { Context, Next } from "hono";
import { config } from "../config";

export async function auth(c: Context, next: Next) {

  if (process.env.NODE_ENV === 'development' && c.req.path === '/graphql') {
    return next();
  }
  if (process.env.NODE_ENV === 'development' && c.req.path === '/openapi') {
    return next();
  }
  if (process.env.NODE_ENV === 'development' && c.req.path === '/docs') {
    return next();
  }

  const apiKey = c.req.header("x-api-key");
  if (!apiKey || apiKey !== config.API_KEY) {
    return c.json(
      {
        message: "Invalid or missing API key",
      },
      401
    );
  }

  await next();
}