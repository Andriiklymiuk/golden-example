import { Context } from 'hono';

export interface GraphQLContext {
  req: Request;
  honoCtx: Context;
}