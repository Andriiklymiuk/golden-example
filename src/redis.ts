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
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Initial Redis connection failed:', error);
    return false;
  }
}

async function checkRedisConnection(currentRedis: RedisClient | null): Promise<RedisClient | null> {
  console.log('Checking Redis connection...');

  if (currentRedis && currentRedis.isOpen) {
    try {
      console.log('Testing existing Redis connection');
      await currentRedis.ping();
      console.log('Existing Redis connection is valid');
      return currentRedis;
    } catch (error) {
      console.error('Existing Redis ping failed:', error);
      try {
        await currentRedis.disconnect();
        console.log('Disconnected failed Redis connection');
      } catch (disconnectError) {
        console.error('Error disconnecting failed Redis connection:', disconnectError);
      }
    }
  }

  try {
    if (redisClient.isOpen) {
      console.log('Disconnecting existing Redis connection');
      await redisClient.disconnect();
    }
    console.log('Attempting new Redis connection');
    await redisClient.connect();
    await redisClient.ping();
    console.log('New Redis connection established and verified');
    return redisClient;
  } catch (error) {
    console.error('Redis connection attempt failed:', error);
    hasLoggedInitialError = false;
    return null;
  }
}

export { initializeRedis, checkRedisConnection };
export type RedisClient = typeof redisClient;