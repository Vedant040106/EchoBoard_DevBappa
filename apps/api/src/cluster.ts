import cluster from 'node:cluster';
import os from 'node:os';
import { logger } from './utils/logger.js';

if (cluster.isPrimary) {
  // Determine worker concurrency from WEB_CONCURRENCY or available hardware threads
  const availableCores = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
  const configuredConcurrency = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : NaN;
  const numWorkers = !isNaN(configuredConcurrency) && configuredConcurrency > 0
    ? configuredConcurrency
    : Math.max(1, availableCores);

  logger.info(
    {
      primaryPid: process.pid,
      workers: numWorkers,
      cores: availableCores,
      concurrencyEnv: process.env.WEB_CONCURRENCY || 'auto',
    },
    `[Cluster Primary] Starting EchoBoard API multi-worker cluster with ${numWorkers} worker(s)`
  );

  // Fork initial worker processes
  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();
    logger.info({ workerPid: worker.process.pid, workerIndex: i + 1 }, 'Spawned cluster worker');
  }

  // Handle worker process death and auto-respawn
  cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect) {
      logger.info({ workerPid: worker.process.pid }, 'Worker disconnected gracefully on shutdown');
    } else {
      logger.error(
        { workerPid: worker.process.pid, code, signal },
        'Worker crashed unexpectedly; respawning replacement worker...'
      );
      const replacement = cluster.fork();
      logger.info({ replacementPid: replacement.process.pid }, 'Replacement worker spawned');
    }
  });

  // Forward termination signals to all active workers
  let isShuttingDown = false;
  const forwardSignal = (signal: NodeJS.Signals) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal, primaryPid: process.pid }, 'Cluster primary received shutdown signal; notifying all workers');

    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      if (worker && worker.isConnected()) {
        worker.process.kill(signal);
      }
    }
  };

  process.on('SIGTERM', () => forwardSignal('SIGTERM'));
  process.on('SIGINT', () => forwardSignal('SIGINT'));
} else {
  // Worker process: start standard HTTP and Socket.IO server
  import('./server.js').catch((err) => {
    logger.fatal({ err, workerPid: process.pid }, 'Failed to start cluster worker server');
    process.exit(1);
  });
}
