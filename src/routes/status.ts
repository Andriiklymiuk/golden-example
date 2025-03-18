import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import type { AppDatabase } from '../db';
import type { RedisClient } from '../redis';
import { checkRedisConnection } from '../redis';

const statusRoutes = new Hono<{
  Variables: {
    db: AppDatabase;
    redis: RedisClient | null;
  }
}>();

statusRoutes.get('/',
  describeRoute({
    summary: 'Get system status',
    description: 'Returns the current status of Redis and database connections',
    responses: {
      200: {
        description: 'System status information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                redisStatus: {
                  type: 'string',
                  enum: ['success', 'failure', 'not connected'],
                  description: 'Status of the Redis connection'
                },
                dbStatus: {
                  type: 'string',
                  enum: ['success', 'failure', 'not connected'],
                  description: 'Status of the database connection'
                },
                dbType: {
                  type: 'string',
                  enum: ['internal', 'postgres'],
                  description: 'Type of database being used'
                }
              },
              required: ['redisStatus', 'dbStatus', 'dbType']
            }
          }
        }
      },
      500: {
        description: 'Server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }),
  async (c) => {
    const db = c.get('db');
    const currentRedis = c.get('redis');
    const redis = await checkRedisConnection(currentRedis);

    let redisStatus: 'success' | 'failure' | 'not connected';
    try {
      if (redis) {
        await redis.ping();
        redisStatus = 'success';
        c.set('redis', redis);
      } else {
        redisStatus = 'not connected';
        c.set('redis', null);
      }
    } catch (error) {
      redisStatus = 'failure';
      c.set('redis', null);
    }

    let dbStatus: 'success' | 'failure' | 'not connected';
    const dbType = process.env.USE_POSTGRES === 'true' ? 'postgres' : 'internal';

    try {
      if (db) {
        await db.listUsers();
        dbStatus = 'success';
      } else {
        dbStatus = 'not connected';
      }
    } catch (error) {
      dbStatus = 'failure';
    }

    return c.json({
      redisStatus,
      dbStatus,
      dbType,
    });
  }
);

export { statusRoutes };