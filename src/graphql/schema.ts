export const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
    recipes: [Recipe!]!
  }

  type Recipe {
    id: ID!
    userId: String!
    title: String!
    ingredients: [String!]!
    instructions: String!
    createdAt: String!
    updatedAt: String!
    user: User!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreateRecipeInput {
    userId: String!
    title: String!
    ingredients: [String!]!
    instructions: String!
  }

  input UpdateRecipeInput {
    title: String
    ingredients: [String!]
    instructions: String
  }

  type Query {
    users(query: String): [User!]!
    user(id: ID!): User
    recipes(userId: ID, query: String): [Recipe!]!
    recipe(id: ID!): Recipe
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    createRecipe(input: CreateRecipeInput!): Recipe!
    updateRecipe(id: ID!, input: UpdateRecipeInput!): Recipe!
    deleteRecipe(id: ID!): Boolean!
  }
`;