import { Database, User, Recipe } from "./types";

export const db: Database = {
  users: new Map<string, User>(),
  recipes: new Map<string, Recipe>(),
};