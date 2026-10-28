import { swrCache } from './swr-cache.js';
import { pool } from '../db/index.js';
import { logger } from '../utils/logger.js';

export const CACHE_CHANNELS = {
  EVENTS: 'cache:events',
  FEEDBACK: 'cache:feedback',
  STATS: 'cache:stats',
  CANVAS: 'cache:canvas',
  ALL: 'cache:all',
} as const;

export type CacheChannel = (typeof CACHE_CHANNELS)[keyof typeof CACHE_CHANNELS];

/**
 * Purges in-memory SWR cache keys according to domain boundaries.
 */
export function purgeLocalCache(channel: CacheChannel): void {
  switch (channel) {
    case CACHE_CHANNELS.FEEDBACK: {
      swrCache.invalidate('feedback');
      swrCache.invalidate('stats');
      swrCache.invalidate('canvas');
      break;
    }
    case CACHE_CHANNELS.EVENTS: {
      swrCache.invalidate('events');
      swrCache.invalidate('stats');
      break;
    }
    case CACHE_CHANNELS.CANVAS: {
      swrCache.invalidate('canvas');
      swrCache.invalidate('feedback');
      break;
    }
    case CACHE_CHANNELS.STATS: {
      swrCache.invalidate('stats');
      break;
    }
    case CACHE_CHANNELS.ALL:
    default: {
      swrCache.clear();
      break;
    }
  }
}

/**
 * Triggers cache invalidation both locally and broadcasts to other cluster workers / instances
 * via PostgreSQL NOTIFY (channel: devbappa_cache_invalidation).
 */
export async function invalidateCache(channel: CacheChannel): Promise<void> {
  // 1. Invalidate locally immediately
  purgeLocalCache(channel);

  // 2. Broadcast via PostgreSQL NOTIFY if connected
  try {
    await pool.query('SELECT pg_notify($1, $2)', ['devbappa_cache_invalidation', channel]);
  } catch (err) {
    // Non-fatal if DB is single-instance or connection is pooler-only
    logger.debug({ channel, err }, 'Cross-instance PG cache invalidation notify skipped');
  }
}

export const invalidateFeedbackCache = () => invalidateCache(CACHE_CHANNELS.FEEDBACK);
export const invalidateEventsCache = () => invalidateCache(CACHE_CHANNELS.EVENTS);
export const invalidateCanvasCache = () => invalidateCache(CACHE_CHANNELS.CANVAS);
export const invalidateStatsCache = () => invalidateCache(CACHE_CHANNELS.STATS);
export const invalidateAllCache = () => invalidateCache(CACHE_CHANNELS.ALL);
