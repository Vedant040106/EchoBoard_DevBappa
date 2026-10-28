import { Router } from 'express';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';
import { swrRoute } from '../../cache/swr-cache.js';

export const statsRouter = Router();

// GET /api/v1/stats - Authoritative public statistics (TTL: 3s, SWR: 10s)
statsRouter.get(
  '/',
  swrRoute(
    () => 'stats:public',
    3,
    10,
    async () => FeedbackRepository.getPublicStats()
  )
);
