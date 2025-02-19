import { db } from '../db';
import { User, Recipe } from '../types';

export const resolvers = {
  Query: {
    users: (_, { query }: { query?: string }) => {
      const users = Array.from(db.users.values());
      if (query) {
        const searchQuery = query.toLowerCase();
        return users.filter(
          user =>
            user.name.toLowerCase().includes(searchQuery) ||
            user.email.toLowerCase().includes(searchQuery)
        );
      }
      return users;
    },

    user: (_, { id }: { id: string }) => {
      return db.users.get(id);
    },

    recipes: (_, { userId, query }: { userId?: string; query?: string }) => {
      let recipes = Array.from(db.recipes.values());

      if (userId) {
        recipes = recipes.filter(recipe => recipe.userId === userId);
      }

      if (query) {
        const searchQuery = query.toLowerCase();
        recipes = recipes.filter(
          recipe =>
            recipe.title.toLowerCase().includes(searchQuery) ||
            recipe.ingredients.some(ingredient =>
              ingredient.toLowerCase().includes(searchQuery)
            )
        );
      }

      return recipes;
    },

    recipe: (_, { id }: { id: string }) => {
      return db.recipes.get(id);
    },
  },

  Mutation: {
    createUser: (_, { input }: { input: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const user: User = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.users.set(user.id, user);
      return user;
    },

    updateUser: (_, { id, input }: { id: string; input: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> }) => {
      const user = db.users.get(id);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser: User = {
        ...user,
        ...input,
        updatedAt: new Date(),
      };
      db.users.set(id, updatedUser);
      return updatedUser;
    },

    deleteUser: (_, { id }: { id: string }) => {
      const exists = db.users.has(id);
      if (!exists) {
        throw new Error('User not found');
      }
      return db.users.delete(id);
    },

    createRecipe: (_, { input }: { input: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const user = db.users.get(input.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const recipe: Recipe = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.recipes.set(recipe.id, recipe);
      return recipe;
    },

    updateRecipe: (_, { id, input }: { id: string; input: Partial<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> }) => {
      const recipe = db.recipes.get(id);
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const updatedRecipe: Recipe = {
        ...recipe,
        ...input,
        updatedAt: new Date(),
      };
      db.recipes.set(id, updatedRecipe);
      return updatedRecipe;
    },

    deleteRecipe: (_, { id }: { id: string }) => {
      const exists = db.recipes.has(id);
      if (!exists) {
        throw new Error('Recipe not found');
      }
      return db.recipes.delete(id);
    },
  },

  User: {
    recipes: (parent: User) => {
      return Array.from(db.recipes.values()).filter(
        recipe => recipe.userId === parent.id
      );
    },
  },

  Recipe: {
    user: (parent: Recipe) => {
      const user = db.users.get(parent.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    },
  },
};