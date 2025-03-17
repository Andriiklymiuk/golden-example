import { DatabaseInterface } from '../db';
import { User, Recipe } from '../types';

export const resolvers = {
  Query: {
    users: async (_: any, { query }: { query?: string }, ctx: { db: DatabaseInterface }) => {
      const users = await ctx.db.listUsers();
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
    user: async (_: any, { id }: { id: string }, ctx: { db: DatabaseInterface }) => {
      return await ctx.db.getUser(id);
    },
    recipes: async (_: any, { userId, query }: { userId?: string; query?: string }, ctx: { db: DatabaseInterface }) => {
      return await ctx.db.listRecipes({ userId, searchQuery: query });
    },
    recipe: async (_: any, { id }: { id: string }, ctx: { db: DatabaseInterface }) => {
      return await ctx.db.getRecipe(id);
    },
  },
  Mutation: {
    createUser: async (_: any, { input }: { input: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }, ctx: { db: DatabaseInterface }) => {
      return await ctx.db.createUser(input);
    },
    updateUser: async (_: any, { id, input }: { id: string; input: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> }, ctx: { db: DatabaseInterface }) => {
      const updatedUser = await ctx.db.updateUser(id, input);
      if (!updatedUser) {
        throw new Error('User not found');
      }
      return updatedUser;
    },
    deleteUser: async (_: any, { id }: { id: string }, ctx: { db: DatabaseInterface }) => {
      const success = await ctx.db.deleteUser(id);
      if (!success) {
        throw new Error('User not found');
      }
      return success;
    },
    createRecipe: async (_: any, { input }: { input: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> }, ctx: { db: DatabaseInterface }) => {
      const user = await ctx.db.getUser(input.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return await ctx.db.createRecipe(input);
    },
    updateRecipe: async (_: any, { id, input }: { id: string; input: Partial<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> }, ctx: { db: DatabaseInterface }) => {
      const recipe = await ctx.db.getRecipe(id);
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const updatedRecipe = await ctx.db.updateRecipe(id, input);
      if (!updatedRecipe) {
        throw new Error('Failed to update recipe');
      }
      return updatedRecipe;
    },
    deleteRecipe: async (_: any, { id }: { id: string }, ctx: { db: DatabaseInterface }) => {
      const recipe = await ctx.db.getRecipe(id);
      if (!recipe) {
        throw new Error('Recipe not found');
      }
      return await ctx.db.deleteRecipe(id);
    },
  },
  User: {
    recipes: async (parent: User, _: any, ctx: { db: DatabaseInterface }) => {
      return await ctx.db.listRecipes({ userId: parent.id });
    },
  },
  Recipe: {
    user: async (parent: Recipe, _: any, ctx: { db: DatabaseInterface }) => {
      const user = await ctx.db.getUser(parent.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    },
  },
};