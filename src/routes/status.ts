import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import type { AppDatabase } from '../db';
import type { RedisClient } from '../redis';
import { checkRedisConnection } from '../redis';
import { checkPostgresConnection, InMemoryDB } from '../db';

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
                  enum: ['in-memory', 'postgres'],
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
    const currentDb = c.get('db');
    const currentRedis = c.get('redis');

    console.log('Starting status check...');
    const db = await checkPostgresConnection(currentDb);
    c.set('db', db);

    const redis = await checkRedisConnection(currentRedis);
    console.log('Redis connection check completed:', redis ? 'connected' : 'not connected');

    let redisStatus: 'success' | 'failure' | 'not connected' = redis ? 'success' : 'not connected';
    try {
      if (redis) {
        console.log('Verifying Redis with ping');
        await redis.ping();
        redisStatus = 'success';
        c.set('redis', redis);
      } else {
        redisStatus = 'not connected';
        c.set('redis', null);
      }
    } catch (error) {
      console.error('Redis ping failed unexpectedly:', error);
      redisStatus = 'failure';
      c.set('redis', null);
    }

    let dbStatus: 'success' | 'failure' | 'not connected';
    const dbType = db instanceof InMemoryDB ? 'in-memory' : 'postgres';

    try {
      if (db) {
        console.log('Verifying DB connection');
        await db.listUsers();
        dbStatus = 'success';
      } else {
        dbStatus = 'not connected';
      }
    } catch (error) {
      console.error('DB check failed:', error);
      dbStatus = 'failure';
    }

    const response = {
      redisStatus,
      dbStatus,
      dbType,
    };
    return c.json(response);
  }
);

export { statusRoutes };