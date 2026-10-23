import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { API_ERROR_CODES } from '@devbappa/shared';

export function errorHandler(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'none';
  const status = err.status || 500;

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code: err.code,
      },
      correlationId,
      path: req.path,
      method: req.method,
    },
    'Unhandled request error'
  );

  res.status(status).json({
    success: false,
    error: {
      code: status === 500 ? API_ERROR_CODES.INTERNAL_SERVER_ERROR : API_ERROR_CODES.CONFLICT,
      message:
        status === 500
          ? 'An internal error occurred while processing your request. Please try again later.'
          : err.message,
      correlationId,
    },
  });
}
