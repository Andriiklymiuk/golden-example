import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db-schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    database: process.env.DB_NAME || 'golden',
    port: Number(process.env.DB_PORT) || 5689,
    password: process.env.DB_PASSWORD,
  },
} satisfies Config;