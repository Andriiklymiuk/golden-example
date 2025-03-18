import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './schema';
import { User, Recipe } from './types';

export interface DatabaseInterface {
  getUser: (id: string) => Promise<User | undefined>;
  listUsers: () => Promise<User[]>;
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<User | undefined>;
  deleteUser: (id: string) => Promise<boolean>;

  getRecipe: (id: string) => Promise<Recipe | undefined>;
  listRecipes: (filters?: { userId?: string; searchQuery?: string }) => Promise<Recipe[]>;
  createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Recipe | undefined>;
  deleteRecipe: (id: string) => Promise<boolean>;
}

export class InMemoryDB implements DatabaseInterface {
  private users: Map<string, User>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.users = new Map<string, User>();
    this.recipes = new Map<string, Recipe>();

    const testUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testRecipe: Recipe = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: testUser.id,
      title: 'Test Recipe',
      ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'],
      instructions: '1. Mix ingredients\n2. Cook\n3. Serve',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(testUser.id, testUser);
    this.recipes.set(testRecipe.id, testRecipe);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async listRecipes(filters?: { userId?: string; searchQuery?: string }): Promise<Recipe[]> {
    let recipes = Array.from(this.recipes.values());

    if (filters?.userId) {
      recipes = recipes.filter(recipe => recipe.userId === filters.userId);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      recipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(query)
        )
      );
    }

    return recipes;
  }

  async createRecipe(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const now = new Date();
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      ...recipeData,
      createdAt: now,
      updatedAt: now,
    };
    this.recipes.set(recipe.id, recipe);
    return recipe;
  }

  async updateRecipe(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Recipe | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;

    const updatedRecipe: Recipe = {
      ...recipe,
      ...data,
      updatedAt: new Date(),
    };
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.recipes.delete(id);
  }
}

class DrizzleDB implements DatabaseInterface {
  private db: NodePgDatabase<typeof schema>;
  private pool: Pool;

  constructor(db: NodePgDatabase<typeof schema>, pool: Pool) {
    this.db = db;
    this.pool = pool;
  }

  private async query(sql: string, params: any[] = []): Promise<any> {
    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0 ? this.formatUser(result.rows[0]) : undefined;
  }

  async listUsers(): Promise<User[]> {
    const result = await this.query('SELECT * FROM users');
    return result.rows.map((row: any) => this.formatUser(row));
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await this.query(
      'INSERT INTO users (id, name, email, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, userData.name, userData.email, now, now]
    );

    return this.formatUser(result.rows[0]);
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | undefined> {
    const now = new Date();
    const fields: string[] = [];
    const values: any[] = [id, now];
    let paramCounter = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCounter++}`);
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${paramCounter++}`);
      values.push(data.email);
    }

    if (fields.length === 0) {
      fields.push(`"updatedAt" = $2`);
    }

    const result = await this.query(
      `UPDATE users SET ${fields.join(', ')}, "updatedAt" = $2 WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.formatUser(result.rows[0]) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const result = await this.query(
      'SELECT * FROM recipes WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0 ? this.formatRecipe(result.rows[0]) : undefined;
  }

  async listRecipes(filters?: { userId?: string; searchQuery?: string }): Promise<Recipe[]> {
    let sql = 'SELECT * FROM recipes';
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (filters?.userId) {
      conditions.push(`"userId" = $${paramCounter++}`);
      values.push(filters.userId);
    }

    if (filters?.searchQuery) {
      conditions.push(`(title ILIKE $${paramCounter} OR ingredients::text ILIKE $${paramCounter})`);
      values.push(`%${filters.searchQuery}%`);
      paramCounter++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.query(sql, values);
    return result.rows.map((row: any) => this.formatRecipe(row));
  }

  async createRecipe(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await this.query(
      'INSERT INTO recipes (id, "userId", title, ingredients, instructions, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, recipeData.userId, recipeData.title, JSON.stringify(recipeData.ingredients), recipeData.instructions, now, now]
    );

    return this.formatRecipe(result.rows[0]);
  }

  async updateRecipe(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Recipe | undefined> {
    const now = new Date();
    const fields: string[] = [];
    const values: any[] = [id, now];
    let paramCounter = 3;

    if (data.userId !== undefined) {
      fields.push(`"userId" = $${paramCounter++}`);
      values.push(data.userId);
    }

    if (data.title !== undefined) {
      fields.push(`title = $${paramCounter++}`);
      values.push(data.title);
    }

    if (data.ingredients !== undefined) {
      fields.push(`ingredients = $${paramCounter++}`);
      values.push(JSON.stringify(data.ingredients));
    }

    if (data.instructions !== undefined) {
      fields.push(`instructions = $${paramCounter++}`);
      values.push(data.instructions);
    }

    if (fields.length === 0) {
      fields.push(`"updatedAt" = $2`);
    }

    const result = await this.query(
      `UPDATE recipes SET ${fields.join(', ')}, "updatedAt" = $2 WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.formatRecipe(result.rows[0]) : undefined;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM recipes WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  private formatUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  private formatRecipe(row: any): Recipe {
    let ingredients = row.ingredients;

    if (typeof ingredients === 'string') {
      try {
        ingredients = JSON.parse(ingredients);
      } catch (e) {
        console.error('Error parsing ingredients:', e);
        ingredients = [];
      }
    }

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      ingredients: ingredients,
      instructions: row.instructions,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

export const postgresPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
});

let hasLoggedInitialDbError = false;

postgresPool.on('error', (err) => {
  if (!hasLoggedInitialDbError) {
    console.error('Postgres Client Error:', err);
    hasLoggedInitialDbError = true;
  }
});

postgresPool.on('connect', () => {
  hasLoggedInitialDbError = false;
  console.log('Postgres Client Connected');
});

async function initializePostgres(): Promise<DatabaseInterface | null> {
  try {
    const client = await postgresPool.connect();
    client.release();
    const drizzleDb = drizzle(postgresPool, { schema });
    await migrate(drizzleDb, { migrationsFolder: './drizzle' });
    console.log('Postgres migrations completed successfully');
    return new DrizzleDB(drizzleDb, postgresPool);
  } catch (error) {
    console.log('Postgres initialization failed, falling back to in-memory DB');
    return null;
  }
}

async function checkPostgresConnection(currentDb: DatabaseInterface | null): Promise<DatabaseInterface> {
  if (currentDb && !(currentDb instanceof InMemoryDB)) {
    try {
      await currentDb.listUsers();
      return currentDb;
    } catch (error) {
      console.error('Existing Postgres connection failed:', error);
    }
  }

  try {
    const client = await postgresPool.connect();
    client.release();
    const drizzleDb = drizzle(postgresPool, { schema });
    await migrate(drizzleDb, { migrationsFolder: './drizzle' });
    console.log('Postgres reconnected and migrations applied');
    return new DrizzleDB(drizzleDb, postgresPool);
  } catch (error) {
    hasLoggedInitialDbError = false;
    console.log('Postgres connection attempt failed, using in-memory DB');
    return new InMemoryDB();
  }
}

export { initializePostgres, checkPostgresConnection };
export type AppDatabase = DatabaseInterface;