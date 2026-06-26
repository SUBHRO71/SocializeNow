import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('Redis: Max retry attempts reached');
      return null;
    }
    return Math.min(times * 200, 5000);
  },
};

// Main Redis client for caching
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('⚡ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

// Create a separate connection for BullMQ (it needs its own)
const createBullMQConnection = () => new Redis(redisConfig);

export { redis, redisConfig, createBullMQConnection };
export default redis;
