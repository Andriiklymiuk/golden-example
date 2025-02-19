import { Hono } from "hono"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { openAPISpecs } from 'hono-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { auth } from "./middlewares/auth"
import { userRoutes } from "./routes/users"
import { recipeRoutes } from "./routes/recipes"
import { config } from "./config"
import { typeDefs } from './graphql/schema'
import { resolvers } from './graphql/resolvers'
import type { GraphQLContext } from './graphql/context'

const app = new Hono()

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

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
})

app.use("*", logger())
app.use("*", prettyJSON())
app.use("*", auth)

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
            name: 'x-api-key'
          }
        }
      },
      security: [{ apiKey: [] }]
    }
  })
)

app.get(
  '/docs',
  apiReference({
    theme: 'saturn',
    spec: { url: '/openapi' }
  })
)

app.route("/api/users", userRoutes)
app.route("/api/recipes", recipeRoutes)

app.all('/graphql', async (c) => {
  const response = await yoga.fetch(c.req.raw, {
    req: c.req.raw,
    honoCtx: c
  })
  return new Response(response.body, response)
})

export default {
  port: config.PORT,
  fetch: app.fetch,
}