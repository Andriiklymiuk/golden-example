import { Database, User, Recipe } from "./types";

export const db: Database = {
  users: new Map<string, User>(),
  recipes: new Map<string, Recipe>(),
};

const testUser: User = {
  id: "test-user-123",
  name: "Test User",
  email: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date()
};

const testRecipe: Recipe = {
  id: "recipe-123",
  userId: testUser.id,
  title: "Test Recipe",
  ingredients: ["Ingredient 1", "Ingredient 2", "Ingredient 3"],
  instructions: "1. Mix ingredients\n2. Cook\n3. Serve",
  createdAt: new Date(),
  updatedAt: new Date()
};

db.users.set(testUser.id, testUser);
db.recipes.set(testRecipe.id, testRecipe);