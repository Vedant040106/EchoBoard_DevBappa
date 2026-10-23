import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { initSocketServer } from './realtime/socket.server.js';
import { runMigrations } from './db/migrate.js';
import { seedInitialAdmin } from './db/seed.js';
import { pool } from './db/index.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

async function startServer(): Promise<void> {
  try {
    logger.info('Initializing DevBappa Live Feedback Wall API...');

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

    server.listen(config.port, '0.0.0.0', () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          origins: config.corsOrigins,
        },
        `🚀 DevBappa Live Feedback Wall API listening on http://0.0.0.0:${config.port}`
      );
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start API server');
    process.exit(1);
  }
}

// Graceful shutdown handling
function handleShutdown(signal: string): void {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully...');
  server.close(async () => {
    logger.info('HTTP and WebSocket server closed.');
    try {
      await pool.end();
      logger.info('Database pool drained.');
    } catch (err) {
      logger.error({ err }, 'Error during database pool drain');
    }
    process.exit(0);
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
