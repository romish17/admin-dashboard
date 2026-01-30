import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

export const REDIS_KEYS = {
  refreshToken: (userId: string) => `refresh_token:${userId}`,
  searchCache: (query: string, userId: string) => `search:${userId}:${query}`,
  rssCache: (feedId: string) => `rss:${feedId}`,
  rateLimitKey: (ip: string) => `rate_limit:${ip}`,
} as const;

export const REDIS_TTL = {
  refreshToken: 60 * 60 * 24 * 7, // 7 days
  searchCache: 60 * 5, // 5 minutes
  rssCache: 60 * 15, // 15 minutes
} as const;
