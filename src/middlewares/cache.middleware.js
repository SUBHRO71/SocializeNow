import redis from '../config/redis.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Cache middleware factory
 * @param {string|Function} keyOrFn - Cache key string or function(req) => string
 * @param {number} ttl - TTL in seconds (default 300 = 5 minutes)
 */
const cache = (keyOrFn, ttl = 300) => async (req, res, next) => {
  try {
    const key = typeof keyOrFn === 'function' ? keyOrFn(req) : keyOrFn;
    const cached = await redis.get(key);

    if (cached) {
      const data = JSON.parse(cached);
      return res.status(200).json(
        new ApiResponse(200, data, 'Fetched from cache')
      );
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (body && body.success !== false && res.statusCode < 400) {
        redis.setex(key, ttl, JSON.stringify(body.data || body)).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    // If Redis fails, skip cache and continue
    next();
  }
};

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Redis key pattern (supports glob)
 */
const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
};

export { cache, invalidateCache };
