import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { config } from "./config";
import { auth } from "./middleware/auth";
import { userRoutes } from "./routes/users";
import { recipeRoutes } from "./routes/recipes";

const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", auth);

// Mount routes
app.route("/api/users", userRoutes);
app.route("/api/recipes", recipeRoutes);

export default {
  port: config.PORT,
  fetch: app.fetch,
};