import { Router, type Request, type Response, type NextFunction } from 'express';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';

export const statsRouter = Router();

// GET /api/v1/stats - Authoritative public statistics
statsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await FeedbackRepository.getPublicStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});
