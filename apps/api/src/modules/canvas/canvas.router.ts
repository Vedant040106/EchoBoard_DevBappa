import { Router, type Request, type Response, type NextFunction } from 'express';
import { layoutUpdateSchema, type LayoutUpdateInput, API_ERROR_CODES } from '@devbappa/shared';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';
import { CanvasRepository } from '../../db/repositories/canvas.repository.js';
import { AuditRepository } from '../../db/repositories/audit.repository.js';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { broadcastLayoutUpdated } from '../../realtime/socket.server.js';

export const canvasRouter = Router();

// GET /api/v1/canvas/layout - Fetch all visible notes layout
canvasRouter.get('/layout', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await FeedbackRepository.getPublicNotes();
    const layout = notes.map((n) => ({
      feedbackId: n.id,
      ...n.layout,
    }));
    res.json({
      success: true,
      data: layout,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/canvas/layout/:feedbackId - Update single note layout (Admin protected)
canvasRouter.patch(
  '/layout/:feedbackId',
  requireAdminAuth,
  validateBody(layoutUpdateSchema),
  async (req: Request<{ feedbackId: string }, {}, LayoutUpdateInput>, res: Response, next: NextFunction) => {
    try {
      const { feedbackId } = req.params;
      const updates = req.body;

      const updated = await CanvasRepository.updateLayout(feedbackId, updates);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Note canvas layout not found',
          },
        });
        return;
      }

      // Record audit event
      if (req.adminId) {
        await AuditRepository.recordEvent({
          adminId: req.adminId,
          feedbackId,
          action: 'update-layout',
          newState: updates as Record<string, unknown>,
          correlationId: req.correlationId,
        });
      }

      // Broadcast layout update to connected clients
      broadcastLayoutUpdated(feedbackId, updated);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);
