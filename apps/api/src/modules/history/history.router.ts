import { Router, type Request, type Response, type NextFunction } from 'express';
import { historyQuerySchema, type HistoryQueryInput } from '@devbappa/shared';
import { validateQuery } from '../../middleware/validate.middleware.js';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';

export const historyRouter = Router();

// GET /api/v1/history - Searchable, paginated public feedback history with event filtering
historyRouter.get(
  '/',
  validateQuery(historyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, role, eventId, page, limit } = req.query as unknown as HistoryQueryInput;
      const result = await FeedbackRepository.getPublicHistory({
        search,
        role,
        eventId,
        page: Number(page) || 1,
        limit: Number(limit) || 12,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);
