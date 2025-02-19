import { Context, Next } from "hono";
import { config } from "../config";

export async function auth(c: Context, next: Next) {
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