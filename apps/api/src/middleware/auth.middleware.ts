import type { Request, Response, NextFunction } from 'express';
import { AdminRepository } from '../db/repositories/admin.repository.js';
import { config } from '../config/index.js';
import { API_ERROR_CODES } from '@devbappa/shared';

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      sessionToken?: string;
      correlationId?: string;
    }
  }
}

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check HttpOnly session cookie first, then Bearer header fallback
  let sessionId = req.cookies?.[config.sessionCookieName];

  if (!sessionId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }
  }

  if (!sessionId) {
    res.status(401).json({
      success: false,
      error: {
        code: API_ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required to access administrative resource',
      },
    });
    return;
  }

  try {
    const session = await AdminRepository.findValidSession(sessionId);
    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Session has expired or is invalid. Please log in again.',
        },
      });
      return;
    }

    req.adminId = session.admin_id;
    req.sessionToken = sessionId;
    next();
  } catch (err) {
    next(err);
  }
}
