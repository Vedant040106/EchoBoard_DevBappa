import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { initSocketServer, closeSocketServer } from './realtime/socket.server.js';
import { runMigrations } from './db/migrate.js';
import { seedInitialAdmin } from './db/seed.js';
import { pool } from './db/index.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

// Keep-alive timeouts to prevent 502 Bad Gateway drops on upstream reverse proxies (Render / AWS ALB)
// Upstream proxy idle timeout is typically 60s; server must exceed it.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Track active HTTP requests to prevent terminating in-flight feedback transactions
let inFlightRequests = 0;
server.on('request', (_req, res) => {
  inFlightRequests++;
  const onDone = () => {
    inFlightRequests = Math.max(0, inFlightRequests - 1);
  };
  res.on('finish', onDone);
  res.on('close', onDone);
});

// Initialize Socket.IO
initSocketServer(server);

export async function startServer(): Promise<http.Server> {
  try {
    logger.info('Initializing DevBappa Live Feedback Wall API worker...');

    // Run database migrations on startup if database is accessible
    try {
      await runMigrations();
      await seedInitialAdmin();
    } catch (dbErr) {
      logger.warn(
        { dbErr },
        'Initial database connection / migration check could not complete. API will start, but database operations may fail until DB is online.'
      );
    }

    return new Promise((resolve) => {
      server.listen(config.port, '0.0.0.0', () => {
        logger.info(
          {
            pid: process.pid,
            port: config.port,
            env: config.env,
            origins: config.corsOrigins,
          },
          `[DevBappa Live Feedback Wall API] Server listening on http://0.0.0.0:${config.port} (PID ${process.pid})`
        );
        resolve(server);
      });
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start API server');
    process.exit(1);
  }
}

// Graceful shutdown handling with active request draining
let isShuttingDown = false;
async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(
    { signal, inFlightRequests, pid: process.pid },
    'Received shutdown signal; draining active HTTP requests and closing connections...'
  );

  // 1. Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP listener closed, waiting for active requests to finish draining...');

    // 2. Wait up to 5 seconds for in-flight requests to complete
    const drainStart = Date.now();
    while (inFlightRequests > 0 && Date.now() - drainStart < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (inFlightRequests > 0) {
      logger.warn({ remaining: inFlightRequests }, 'Active requests still in flight after drain window');
    } else {
      logger.info('All active HTTP requests drained successfully.');
    }

    // 3. Close Socket.IO and cross-instance LISTEN/NOTIFY client
    try {
      await closeSocketServer();
      logger.info('Socket.IO and cross-instance synchronization closed cleanly.');
    } catch (err) {
      logger.error({ err }, 'Error during Socket.IO closure');
    }

    // 4. Drain PostgreSQL connection pool
    try {
      await pool.end();
      logger.info('PostgreSQL connection pool drained.');
    } catch (err) {
      logger.error({ err }, 'Error during database pool drain');
    }

    logger.info('Graceful shutdown completed successfully.');
    process.exit(0);
  });

  // Force close if graceful shutdown exceeds 10 seconds timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s, forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Start server if executed directly
startServer();
