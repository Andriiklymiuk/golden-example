import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { openAPISpecs } from 'hono-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { auth } from "./middlewares/auth";
import { userRoutes } from "./routes/users";
import { recipeRoutes } from "./routes/recipes";
import { statusRoutes } from "./routes/status";
import { config } from "./config";
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import type { GraphQLContext } from './graphql/context';
import { initializePostgres, AppDatabase, InMemoryDB } from './db';
import { initializeRedis, redisClient, RedisClient } from './redis';

const app = new Hono<{
  Variables: {
    db: AppDatabase;
    redis: RedisClient | null;
  }
}>();

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

let db: AppDatabase | null = null;
let redis: RedisClient | null = null;

(async () => {
  try {
    db = await initializePostgres() || new InMemoryDB();
    console.log('Database initialized successfully');

    const redisConnected = await initializeRedis();
    if (redisConnected) {
      redis = redisClient;
    } else {
      console.log('Redis initialization failed, proceeding without Redis');
      redis = null;
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
})();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", auth);
app.use("*", async (c, next) => {
  if (!db) {
    return c.json({ error: 'Database not initialized' }, 500);
  }
  c.set('db', db);
  c.set('redis', redis);
  await next();
});

app.get(
  '/openapi',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Recipe API',
        version: '1.0.0',
        description: 'API for managing users and their recipes'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server'
        }
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API key for authentication'
          }
        }
      },
      security: [{ apiKey: [] }]
    }
  })
);

app.get(
  '/docs',
  apiReference({
    theme: 'saturn',
    spec: { url: '/openapi' }
  })
);

app.route("/api/users", userRoutes);
app.route("/api/recipes", recipeRoutes);
app.route("/api/status", statusRoutes);

app.all('/api/graphql', async (c) => {
  if (!db) {
    return c.json({ error: 'Database not initialized' }, 500);
  }
  const response = await yoga.fetch(c.req.raw, {
    req: c.req.raw,
    honoCtx: c,
    db: c.get('db')
  });
  return new Response(response.body, response);
});

export default {
  port: config.PORT,
  fetch: app.fetch,
};