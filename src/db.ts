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

db.users.set(testUser.id, testUser);