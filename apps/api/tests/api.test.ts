import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool } from '../src/db/index.js';

// Helper to make mock requests to express app without needing live network port
async function testRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    // Start temporary listener
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        return resolve({ status: 500, body: {} });
      }

      try {
        const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json().catch(() => null);
        server.close(() => {
          resolve({ status: res.status, body: json });
        });
      } catch (err) {
        server.close(() => {
          resolve({ status: 500, body: { error: String(err) } });
        });
      }
    });
  });
}

describe('API Endpoints and Security Gates', () => {
  it('GET /api/v1/health returns health status', async () => {
    const res = await testRequest('GET', '/api/v1/health');
    assert.equal([200, 503].includes(res.status), true);
    assert.equal(typeof res.body.status, 'string');
    assert.equal(typeof res.body.uptimeSeconds, 'number');
  });

  it('GET /health alias returns health status', async () => {
    const res = await testRequest('GET', '/health');
    assert.equal([200, 503].includes(res.status), true);
    assert.equal(typeof res.body.status, 'string');
    assert.equal(typeof res.body.uptimeSeconds, 'number');
  });

  it('GET /api/v1/admin/feedback rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('GET', '/api/v1/admin/feedback');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('GET /api/v1/admin/analytics rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('GET', '/api/v1/admin/analytics');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/v1/admin/feedback/:id/hide rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('POST', '/api/v1/admin/feedback/some-uuid/hide');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/v1/feedback rejects invalid payload with 400 and structured error', async () => {
    const res = await testRequest('POST', '/api/v1/feedback', {
      name: '', // invalid
      role: 'Student',
      message: 'Hi',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details);
  });

  it('GET /api/v1/events/public returns public wallEvents and activeSubmissionEvents', async () => {
    const res = await testRequest('GET', '/api/v1/events/public');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.wallEvents));
    assert.ok(Array.isArray(res.body.data.activeSubmissionEvents));
    assert.ok(res.body.data.wallEvents.length >= 1);
    const techExpo = res.body.data.wallEvents.find((e: any) => e.name === 'Tech Expo');
    assert.ok(techExpo);
    assert.equal(techExpo.venue, 'VPPCOE&VA, Sion');
  });

  it('GET /api/v1/stats includes averageRating and activeWallEvents', async () => {
    const res = await testRequest('GET', '/api/v1/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.data.averageRating, 'number');
    assert.equal(typeof res.body.data.totalAcceptedCount, 'number');
    assert.equal(typeof res.body.data.visibleWallCount, 'number');
    assert.ok(Array.isArray(res.body.data.activeWallEvents));
  });

  it('GET /api/v1/admin/events rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('GET', '/api/v1/admin/events');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/v1/admin/events rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('POST', '/api/v1/admin/events', {
      name: 'Hackathon 2026',
      eventDate: '2026-11-15',
      venue: 'Main Auditorium',
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('PUT /api/v1/admin/events/wall-selection rejects unauthenticated requests with 401', async () => {
    const res = await testRequest('PUT', '/api/v1/admin/events/wall-selection', {
      eventIds: [],
    });
    assert.equal(res.status, 401);
  });

  after(async () => {
    await pool.end();
  });
});
