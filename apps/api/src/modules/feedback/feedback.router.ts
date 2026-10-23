import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  feedbackSubmissionSchema,
  type FeedbackSubmissionInput,
  NOTE_COLORS,
  PIN_VARIANTS,
  API_ERROR_CODES,
} from '@devbappa/shared';
import { validateBody } from '../../middleware/validate.middleware.js';
import { submissionRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';
import { derivePublicDisplayName } from '../../utils/name-sanitizer.js';
import {
  broadcastNewFeedback,
  broadcastStatsUpdated,
} from '../../realtime/socket.server.js';
import { logger } from '../../utils/logger.js';

export const feedbackRouter = Router();

// GET /api/v1/feedback - List all public active notes on the wall
feedbackRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await FeedbackRepository.getPublicNotes();
    res.json({
      success: true,
      data: notes,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/feedback/:id - Get specific public note detail
feedbackRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await FeedbackRepository.getPublicNoteById(req.params.id);
    if (!note) {
      res.status(404).json({
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'Feedback note not found or has been moderated',
        },
      });
      return;
    }
    res.json({
      success: true,
      data: note,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/feedback - Submit new feedback
feedbackRouter.post(
  '/',
  submissionRateLimiter,
  validateBody(feedbackSubmissionSchema),
  async (req: Request<{}, {}, FeedbackSubmissionInput>, res: Response, next: NextFunction) => {
    try {
      const input = req.body;

      // 1. Normalize department
      let department: string | null = null;
      if (input.role === 'Student' || input.role === 'Faculty') {
        if (input.department === 'Other') {
          department = input.departmentOther?.trim() || 'Other';
        } else {
          department = input.department || null;
        }
      }

      // 2. Normalize role-specific fields
      const designation = input.role === 'Faculty' ? input.designation?.trim() || null : null;
      const institutionName =
        input.role === 'Other Visitor' ? input.institutionName?.trim() || null : null;

      // 3. Server-side derive and validate public display name
      const publicDisplayName = derivePublicDisplayName(input.name, input.confirmedDisplayName);

      // 4. Color and Pin selection
      const colorVariant =
        input.colorVariant && NOTE_COLORS.includes(input.colorVariant)
          ? input.colorVariant
          : NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

      const pinVariant = PIN_VARIANTS[Math.floor(Math.random() * PIN_VARIANTS.length)];

      // 5. Persist with transactional idempotency
      const { note, isDuplicate } = await FeedbackRepository.createFeedbackWithLayout({
        fullName: input.name.trim(),
        publicDisplayName,
        role: input.role,
        department,
        designation,
        institutionName,
        message: input.message.trim(),
        idempotencyKey: input.idempotencyKey,
        colorVariant,
        pinVariant,
        sizeVariant: 'standard',
      });

      // 6. Only emit real-time event if this was a new commit (not an idempotent replay)
      if (!isDuplicate) {
        broadcastNewFeedback(note);

        // Fetch and broadcast authoritative stats
        FeedbackRepository.getPublicStats()
          .then((stats) => broadcastStatsUpdated(stats))
          .catch((err) => logger.warn({ err }, 'Failed to broadcast stats after submission'));
      }

      res.status(isDuplicate ? 200 : 201).json({
        success: true,
        data: note,
      });
    } catch (err) {
      next(err);
    }
  }
);
