import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface CacheEntry<T = unknown> {
  data: T;
  etag: string;
  cachedAt: number;
  ttlMs: number;
  swrMs: number;
  isRevalidating?: boolean;
}

export type CacheState = 'HIT' | 'STALE' | 'MISS';

class SwrMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Generates a fast, collision-resistant weak ETag for JSON payloads.
   */
  public generateETag(data: unknown): string {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 16);
    return `W/"${hash}"`;
  }

  /**
   * Retrieves an item from cache, identifying whether it is fresh (HIT),
   * stale-while-revalidate (STALE), or expired/missing (MISS).
   */
  public get<T>(key: string): { entry: CacheEntry<T> | null; state: CacheState } {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return { entry: null, state: 'MISS' };
    }

    const age = Date.now() - entry.cachedAt;
    if (age <= entry.ttlMs) {
      return { entry, state: 'HIT' };
    }

    if (age <= entry.ttlMs + entry.swrMs) {
      return { entry, state: 'STALE' };
    }

    // Completely expired
    this.store.delete(key);
    return { entry: null, state: 'MISS' };
  }

  /**
   * Writes data into the SWR in-memory store.
   */
  public set<T>(key: string, data: T, ttlSeconds: number, swrSeconds: number): CacheEntry<T> {
    const entry: CacheEntry<T> = {
      data,
      etag: this.generateETag(data),
      cachedAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
      swrMs: swrSeconds * 1000,
      isRevalidating: false,
    };
    this.store.set(key, entry as CacheEntry<unknown>);
    return entry;
  }

  /**
   * Reads from cache or computes fresh value via fetcher.
   * If state is STALE, returns stale data immediately and triggers background revalidation.
   */
  public async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    swrSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<{ data: T; etag: string; state: CacheState }> {
    const { entry, state } = this.get<T>(key);

    if (state === 'HIT' && entry) {
      return { data: entry.data, etag: entry.etag, state: 'HIT' };
    }

    if (state === 'STALE' && entry) {
      // Trigger background revalidation if not already revalidating
      if (!entry.isRevalidating) {
        entry.isRevalidating = true;
        fetcher()
          .then((fresh) => {
            this.set(key, fresh, ttlSeconds, swrSeconds);
            logger.debug({ key }, 'SWR background revalidation completed');
          })
          .catch((err) => {
            entry.isRevalidating = false;
            logger.warn({ key, err }, 'SWR background revalidation failed; keeping existing data');
          });
      }
      return { data: entry.data, etag: entry.etag, state: 'STALE' };
    }

    // MISS: must fetch synchronously
    const fresh = await fetcher();
    const newEntry = this.set(key, fresh, ttlSeconds, swrSeconds);
    return { data: newEntry.data, etag: newEntry.etag, state: 'MISS' };
  }

  /**
   * Invalidates specific key or keys matching prefix pattern.
   */
  public invalidate(prefixOrKey: string): number {
    let count = 0;
    if (this.store.has(prefixOrKey)) {
      this.store.delete(prefixOrKey);
      count++;
    }

    for (const key of this.store.keys()) {
      if (key.startsWith(prefixOrKey)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Resets entire cache store.
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Diagnostic statistics.
   */
  public stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

export const swrCache = new SwrMemoryCache();

/**
 * Express middleware helper for SWR cached endpoints.
 * Automatically handles:
 * - 304 Not Modified when client sends If-None-Match
 * - Cache-Control: public, max-age=ttl, stale-while-revalidate=swr
 * - ETag and X-Cache headers
 */
export function swrRoute<T>(
  keyGenerator: (req: Request) => string,
  ttlSeconds: number,
  swrSeconds: number,
  fetcher: (req: Request) => Promise<T>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const { data, etag, state } = await swrCache.getOrFetch(key, ttlSeconds, swrSeconds, () =>
        fetcher(req)
      );

      res.setHeader('ETag', etag);
      res.setHeader(
        'Cache-Control',
        `public, max-age=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`
      );
      res.setHeader('X-Cache', state);

      const clientEtag = req.headers['if-none-match'];
      if (clientEtag && clientEtag === etag) {
        res.status(304).end();
        return;
      }

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  };
}
