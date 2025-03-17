import { Context } from 'hono';
import { AppDatabase } from '../db';

export interface GraphQLContext {
  req: Request;
  honoCtx: Context;
  db: AppDatabase;
}