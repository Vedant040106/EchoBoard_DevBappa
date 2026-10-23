import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { API_ERROR_CODES } from '@devbappa/shared';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: err.errors[0]?.message || 'Validation error in request payload',
            details: err.flatten().fieldErrors,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as unknown as Request['query'];
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: err.errors[0]?.message || 'Validation error in query parameters',
            details: err.flatten().fieldErrors,
          },
        });
        return;
      }
      next(err);
    }
  };
}
