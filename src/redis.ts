import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    reconnectStrategy: false
  },
  disableOfflineQueue: true
});

let hasLoggedInitialError = false;

redisClient.on('error', (err) => {
  if (!hasLoggedInitialError) {
    console.error('Redis Client Error:', err);
    hasLoggedInitialError = true;
  }
});

redisClient.on('connect', () => {
  hasLoggedInitialError = false;
  console.log('Redis Client Connected');
});

async function initializeRedis(): Promise<boolean> {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRedisConnection(currentRedis: RedisClient | null): Promise<RedisClient | null> {
  if (currentRedis && currentRedis.isOpen) {
    try {
      await currentRedis.ping();
      return currentRedis;
    } catch (error) {
      try {
        await currentRedis.disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting failed Redis connection:', disconnectError);
      }
    }
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    hasLoggedInitialError = false;
    return null;
  }
}

export { initializeRedis, checkRedisConnection };
export type RedisClient = typeof redisClient;