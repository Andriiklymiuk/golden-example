# Recipe API with Hono, GraphQL, and OpenAPI

A modern API implementation using Bun, Hono, GraphQL, and OpenAPI documentation.

Collections for Golden Retriever | Postman | Thunderclient are in collections folder

## Features

- 🚀 REST API with CRUD operations
- 📝 OpenAPI/Swagger documentation
- 🎯 GraphQL support
- 🔐 API key authentication
- 🔍 Search functionality
- 🧪 Postman collections included
- 📦 In-memory database

## Setup

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine

### Installation

1. Clone the repository
2. Install dependencies:
```sh
bun install
```

3. Configure environment variables:
```sh
# .env
PORT=3000
API_KEY=your-api-key
```

### Running the Application

Development mode with hot reload:
```sh
bun dev
```

The server will start on http://localhost:3000 (or your configured PORT)

## Available Endpoints

### Documentation

- OpenAPI Documentation: http://localhost:3000/openapi
- Swagger UI: http://localhost:3000/docs
- GraphQL Playground: http://localhost:3000/graphql

### REST API Endpoints

All REST endpoints require the `x-api-key` header.

#### Users

```
GET /api/users
- List all users
- Query parameters:
  - q: Search users by name or email
  
POST /api/users
- Create a new user
- Body: { "name": string, "email": string }

GET /api/users/:id
- Get user by ID

PUT /api/users/:id
- Update user
- Body: { "name": string, "email": string }

DELETE /api/users/:id
- Delete user
```

#### Recipes

```
GET /api/recipes
- List all recipes
- Query parameters:
  - userId: Filter by user ID
  - q: Search recipes by title or ingredients

POST /api/recipes
- Create a new recipe
- Body: {
    "userId": string,
    "title": string,
    "ingredients": string[],
    "instructions": string
  }

GET /api/recipes/:id
- Get recipe by ID

PUT /api/recipes/:id
- Update recipe
- Body: {
    "userId": string,
    "title": string,
    "ingredients": string[],
    "instructions": string
  }

DELETE /api/recipes/:id
- Delete recipe
```

### GraphQL API

Endpoint: `http://localhost:3000/graphql`

Sample Queries:
```graphql
# Get all users with their recipes
query {
  users {
    id
    name
    email
    recipes {
      title
      ingredients
    }
  }
}

# Get user by ID with recipes
query {
  user(id: "user-id") {
    name
    recipes {
      title
      instructions
    }
  }
}

# Create a new recipe
mutation {
  createRecipe(
    input: {
      userId: "user-id"
      title: "Spaghetti Carbonara"
      ingredients: ["spaghetti", "eggs", "pecorino"]
      instructions: "1. Cook pasta..."
    }
  ) {
    id
    title
  }
}
```

## Authentication

All REST API endpoints (except GraphQL in development) require authentication using an API key.

Add the following header to your requests:
```
x-api-key: your-api-key
```

## Development

### Project Structure

```
src/
├── config.ts           # Configuration and environment variables
├── db.ts              # In-memory database setup
├── index.ts           # Main application entry
├── types.ts           # TypeScript type definitions
├── middleware/
│   └── auth.ts        # Authentication middleware
├── routes/
│   ├── users.ts       # User routes with OpenAPI docs
│   └── recipes.ts     # Recipe routes with OpenAPI docs
└── graphql/
    ├── schema.ts      # GraphQL schema definition
    ├── resolvers.ts   # GraphQL resolvers
    └── context.ts     # GraphQL context type
```

### OpenAPI/Swagger

The API documentation is automatically generated from the route definitions using:
- `hono-openapi` for route documentation
- `@hono/zod-validator` for request validation
- Swagger UI for interactive documentation

### Testing

Included Postman collections for testing:
- `users-collection.json`: Tests for user endpoints
- `recipes-collection.json`: Tests for recipe endpoints

Import these collections into Postman to test the API endpoints.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| API_KEY | Authentication key | default-api-key-123 |

## License

MIT