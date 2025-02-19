export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  ingredients: string[];
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Database {
  users: Map<string, User>;
  recipes: Map<string, Recipe>;
}