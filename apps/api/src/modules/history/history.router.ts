import { Router, type Request, type Response, type NextFunction } from 'express';
import { historyQuerySchema, type HistoryQueryInput } from '@devbappa/shared';
import { validateQuery } from '../../middleware/validate.middleware.js';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';

export const historyRouter = Router();

// GET /api/v1/history - Searchable, paginated public feedback history
historyRouter.get(
  '/',
  validateQuery(historyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, role, page, limit } = req.query as unknown as HistoryQueryInput;
      const result = await FeedbackRepository.getPublicHistory({
        search,
        role,
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
