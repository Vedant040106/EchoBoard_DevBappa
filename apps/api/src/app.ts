import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { config } from './config/index.js';
import { healthRouter } from './modules/health/health.router.js';
import { feedbackRouter } from './modules/feedback/feedback.router.js';
import { historyRouter } from './modules/history/history.router.js';
import { statsRouter } from './modules/stats/stats.router.js';
import { canvasRouter } from './modules/canvas/canvas.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { publicEventRouter } from './modules/event/event.router.js';
import { errorHandler } from './middleware/error.middleware.js';
import { API_ERROR_CODES } from '@devbappa/shared';

export const app = express();

// Trust reverse proxy (critical for Render + Vercel HTTPS cookies and rate limiting)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS allowlist supporting production Vercel frontend and local development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        config.corsOrigins.includes(origin) ||
        origin === 'https://echoboarddevbappa.vercel.app' ||
        !config.isProduction ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Attach Correlation ID
app.use((req: Request, _res: Response, next) => {
  req.correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  next();
});

// Health check alias and API Routes prefix
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/events', publicEventRouter);
app.use('/api/v1/history', historyRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/canvas', canvasRouter);
app.use('/api/v1/admin', adminRouter);

// Catch 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: API_ERROR_CODES.NOT_FOUND,
      message: 'API route not found',
    },
  });
});

// Global error handler
app.use(errorHandler);
