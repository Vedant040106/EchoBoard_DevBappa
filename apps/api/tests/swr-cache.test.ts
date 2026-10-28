import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { swrCache } from '../src/cache/swr-cache.js';
import {
  invalidateFeedbackCache,
  invalidateEventsCache,
  invalidateCanvasCache,
  invalidateStatsCache,
} from '../src/cache/invalidator.js';

describe('SWR Memory Cache & Invalidation Engine', () => {
  beforeEach(() => {
    swrCache.clear();
  });

  test('returns MISS on empty cache and caches fresh data', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { message: 'hello world', count: callCount };
    };

    const res1 = await swrCache.getOrFetch('test:key', 1, 2, fetcher);
    assert.equal(res1.state, 'MISS');
    assert.equal(res1.data.message, 'hello world');
    assert.equal(res1.data.count, 1);
    assert.ok(res1.etag.startsWith('W/"'));
    assert.equal(callCount, 1);

    // Second immediate call should be a cache HIT
    const res2 = await swrCache.getOrFetch('test:key', 1, 2, fetcher);
    assert.equal(res2.state, 'HIT');
    assert.equal(res2.data.count, 1);
    assert.equal(res2.etag, res1.etag);
    assert.equal(callCount, 1);
  });

  test('returns STALE in SWR window and triggers background revalidation', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { timestamp: Date.now(), counter: callCount };
    };

    // TTL 0.06s (60ms), SWR 0.5s (500ms)
    const res1 = await swrCache.getOrFetch('swr:key', 0.06, 0.5, fetcher);
    assert.equal(res1.state, 'MISS');
    assert.equal(res1.data.counter, 1);

    // Wait 80ms so TTL expires but within SWR window
    await new Promise((r) => setTimeout(r, 80));

    const res2 = await swrCache.getOrFetch('swr:key', 0.5, 0.5, fetcher);
    assert.equal(res2.state, 'STALE');
    assert.equal(res2.data.counter, 1); // Stale data returned immediately

    // Allow background revalidation promise to complete (revalidation sets TTL to 0.5s)
    await new Promise((r) => setTimeout(r, 60));

    // Next fetch should have fresh data from revalidation and be within the 0.5s TTL
    const res3 = await swrCache.getOrFetch('swr:key', 0.5, 0.5, fetcher);
    assert.equal(res3.state, 'HIT');
    assert.equal(res3.data.counter, 2);
  });

  test('generates matching ETags for identical content', () => {
    const data1 = { a: 1, b: 'two' };
    const data2 = { a: 1, b: 'two' };
    const data3 = { a: 2, b: 'two' };

    const etag1 = swrCache.generateETag(data1);
    const etag2 = swrCache.generateETag(data2);
    const etag3 = swrCache.generateETag(data3);

    assert.equal(etag1, etag2);
    assert.notEqual(etag1, etag3);
    assert.ok(etag1.startsWith('W/"'));
  });

  test('targeted invalidators clear respective cache domains', async () => {
    swrCache.set('feedback:public', [{ id: '1' }], 10, 20);
    swrCache.set('stats:public', { total: 42 }, 10, 20);
    swrCache.set('canvas:layout', [{ x: 0 }], 10, 20);
    swrCache.set('events:public', [{ id: 'e1' }], 10, 20);

    assert.equal(swrCache.stats().size, 4);

    // Invalidate events: clears events & stats
    await invalidateEventsCache();
    assert.equal(swrCache.get('events:public').state, 'MISS');
    assert.equal(swrCache.get('stats:public').state, 'MISS');
    assert.equal(swrCache.get('feedback:public').state, 'HIT');
    assert.equal(swrCache.get('canvas:layout').state, 'HIT');

    // Restore stats
    swrCache.set('stats:public', { total: 42 }, 10, 20);

    // Invalidate feedback: clears feedback, stats, canvas
    await invalidateFeedbackCache();
    assert.equal(swrCache.get('feedback:public').state, 'MISS');
    assert.equal(swrCache.get('stats:public').state, 'MISS');
    assert.equal(swrCache.get('canvas:layout').state, 'MISS');
  });

  test('canvas invalidator clears canvas and feedback caches', async () => {
    swrCache.set('feedback:public', [{ id: '1' }], 10, 20);
    swrCache.set('canvas:layout', [{ x: 0 }], 10, 20);
    swrCache.set('events:public', [{ id: 'e1' }], 10, 20);

    await invalidateCanvasCache();
    assert.equal(swrCache.get('canvas:layout').state, 'MISS');
    assert.equal(swrCache.get('feedback:public').state, 'MISS');
    assert.equal(swrCache.get('events:public').state, 'HIT');
  });
});
