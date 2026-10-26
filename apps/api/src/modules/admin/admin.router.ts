import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  adminLoginSchema,
  adminFeedbackQuerySchema,
  type AdminLoginInput,
  type AdminFeedbackQueryInput,
  API_ERROR_CODES,
} from '@devbappa/shared';
import { config } from '../../config/index.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import { loginRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';
import { AdminRepository } from '../../db/repositories/admin.repository.js';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';
import { AuditRepository } from '../../db/repositories/audit.repository.js';
import { verifyPassword } from '../../security/hasher.js';
import { generateSessionId } from '../../security/session.js';
import {
  broadcastFeedbackHidden,
  broadcastFeedbackRestored,
  broadcastFeedbackDeleted,
  broadcastStatsUpdated,
} from '../../realtime/socket.server.js';
import { logger } from '../../utils/logger.js';
import { adminEventRouter } from '../event/event.router.js';

export const adminRouter = Router();

// Mount events sub-router
adminRouter.use('/events', adminEventRouter);

// POST /api/v1/admin/auth/login
adminRouter.post(
  '/auth/login',
  loginRateLimiter,
  validateBody(adminLoginSchema),
  async (req: Request<{}, {}, AdminLoginInput>, res: Response, next: NextFunction) => {
    try {
      const { adminId, password } = req.body;

      // Look up admin by username
      const admin = await AdminRepository.findByUsername(adminId);
      if (!admin) {
        // Generic failure message to prevent admin user enumeration
        res.status(401).json({
          success: false,
          error: {
            code: API_ERROR_CODES.UNAUTHORIZED,
            message: 'Invalid administrative credentials provided.',
          },
        });
        return;
      }

      // Verify password hash
      const isValid = await verifyPassword(password, admin.password_hash);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: {
            code: API_ERROR_CODES.UNAUTHORIZED,
            message: 'Invalid administrative credentials provided.',
          },
        });
        return;
      }

      // Generate secure session ID
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + config.sessionTtlMs);

      await AdminRepository.createSession(sessionId, admin.id, expiresAt);

      // Set HttpOnly SameSite cookie
      res.cookie(config.sessionCookieName, sessionId, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
        expires: expiresAt,
        path: '/',
      });

      logger.info({ adminId: admin.id }, 'Admin logged in successfully');

      res.json({
        success: true,
        data: {
          adminId: admin.username,
          token: sessionId, // Returned for non-cookie/header-based API consumers
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/auth/session
adminRouter.get('/auth/session', requireAdminAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      authenticated: true,
      adminId: req.adminId,
    },
  });
});

// POST /api/v1/admin/auth/logout
adminRouter.post('/auth/logout', requireAdminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.sessionToken) {
      await AdminRepository.deleteSession(req.sessionToken);
    }

    res.clearCookie(config.sessionCookieName, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      path: '/',
    });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/feedback - Admin feedback table with full private names
adminRouter.get(
  '/feedback',
  requireAdminAuth,
  validateQuery(adminFeedbackQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, role, status, eventId, page, limit } = req.query as unknown as AdminFeedbackQueryInput;
      const data = await FeedbackRepository.getAdminFeedback({
        search,
        role,
        status: status || 'all',
        eventId,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/analytics - Comprehensive analytics
adminRouter.get('/analytics', requireAdminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.query.eventId as string | undefined;
    const analytics = await FeedbackRepository.getAdminAnalytics(eventId);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/feedback/:id/hide - Hide feedback from wall
adminRouter.post(
  '/feedback/:id/hide',
  requireAdminAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await FeedbackRepository.setVisibility(id, 'hidden');

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Feedback record not found or cannot be hidden',
          },
        });
        return;
      }

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        feedbackId: id,
        action: 'hide',
        previousState: { visibility_status: 'visible' },
        newState: { visibility_status: 'hidden' },
        correlationId: req.correlationId,
      });

      // Broadcast realtime event
      broadcastFeedbackHidden(id);

      // Broadcast stats
      FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/feedback/:id/restore - Restore hidden feedback
adminRouter.post(
  '/feedback/:id/restore',
  requireAdminAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await FeedbackRepository.setVisibility(id, 'visible');

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Feedback record not found or cannot be restored',
          },
        });
        return;
      }

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        feedbackId: id,
        action: 'restore',
        previousState: { visibility_status: 'hidden' },
        newState: { visibility_status: 'visible' },
        correlationId: req.correlationId,
      });

      // Broadcast realtime event
      broadcastFeedbackRestored(updated);

      // Broadcast stats
      FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/feedback/:id/soft-delete - Soft-delete feedback
adminRouter.post(
  '/feedback/:id/soft-delete',
  requireAdminAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await FeedbackRepository.softDelete(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Feedback record not found or already deleted',
          },
        });
        return;
      }

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        feedbackId: id,
        action: 'soft-delete',
        newState: { deleted_at: new Date().toISOString() },
        correlationId: req.correlationId,
      });

      // Broadcast realtime event
      broadcastFeedbackDeleted(id);

      // Broadcast stats
      FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});

      res.json({
        success: true,
        data: { message: 'Feedback record soft-deleted successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/feedback/:id/recover - Restricted recovery of soft-deleted record
adminRouter.post(
  '/feedback/:id/recover',
  requireAdminAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await FeedbackRepository.recover(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Feedback record not found or was not deleted',
          },
        });
        return;
      }

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        feedbackId: id,
        action: 'recover',
        newState: { deleted_at: null },
        correlationId: req.correlationId,
      });

      // If it is now visible, broadcast restoration
      const note = await FeedbackRepository.getPublicNoteById(id);
      if (note) {
        broadcastFeedbackRestored(note);
      }

      // Broadcast stats
      FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});

      res.json({
        success: true,
        data: { message: 'Feedback record recovered successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/audit - Audit trail
adminRouter.get(
  '/audit',
  requireAdminAuth,
  async (req: Request<{}, {}, {}, { feedbackId?: string; page?: string; limit?: string }>, res: Response, next: NextFunction) => {
    try {
      const { feedbackId, page, limit } = req.query;
      const events = await AuditRepository.getEvents({
        feedbackId,
        page: Number(page) || 1,
        limit: Number(limit) || 25,
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  }
);
