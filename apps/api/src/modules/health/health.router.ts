import { Router, type Request, type Response } from 'express';
import { checkDatabaseHealth } from '../../db/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const status = dbHealth.ok ? 200 : 503;

  res.status(status).json({
    status: dbHealth.ok ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.ok,
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});
