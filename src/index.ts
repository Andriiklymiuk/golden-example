import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { auth } from "./middleware/auth";
import { userRoutes } from "./routes/users";
import { recipeRoutes } from "./routes/recipes";
import { config } from "./config";
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import type { GraphQLContext } from './graphql/context';

const app = new Hono();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: true,
  graphiql: {
    defaultQuery: `# Welcome to GraphiQL
#
# Try this query to get started:
query {
  users {
    id
    name
    email
    recipes {
      title
    }
  }
}
`
  }
});

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", auth);

app.route("/api/users", userRoutes);
app.route("/api/recipes", recipeRoutes);

app.all('/graphql', async (c) => {
  const response = await yoga.fetch(c.req.raw, {
    req: c.req.raw,
    honoCtx: c
  });

  return new Response(response.body, response);
});

export default {
  port: config.PORT,
  fetch: app.fetch,
};