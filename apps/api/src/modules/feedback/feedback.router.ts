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
import { EventRepository } from '../../db/repositories/event.repository.js';
import { derivePublicDisplayName } from '../../utils/name-sanitizer.js';
import {
  broadcastNewFeedback,
  broadcastStatsUpdated,
  broadcastAdminAutoHeld,
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

      // 1. Resolve target event ID
      let targetEventId = input.eventId;
      if (!targetEventId) {
        const primaryEvent = await EventRepository.getPrimaryActiveSubmissionEvent();
        if (primaryEvent) {
          targetEventId = primaryEvent.id;
        } else {
          // Check if multiple or none are accepting feedback
          const { activeSubmissionEvents } = await EventRepository.getPublicEvents();
          if (activeSubmissionEvents.length === 0) {
            res.status(400).json({
              success: false,
              error: {
                code: API_ERROR_CODES.VALIDATION_ERROR,
                message: 'No events are currently accepting submissions.',
              },
            });
            return;
          } else {
            res.status(400).json({
              success: false,
              error: {
                code: API_ERROR_CODES.VALIDATION_ERROR,
                message: 'Multiple events are open. Please select the event you are attending.',
              },
            });
            return;
          }
        }
      }

      // Verify target event exists and has is_accepting_feedback = true
      const targetEvent = await EventRepository.getEventById(targetEventId);
      if (!targetEvent) {
        res.status(400).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Target event not found.',
          },
        });
        return;
      }
      if (!targetEvent.isAcceptingFeedback) {
        res.status(400).json({
          success: false,
          error: {
            code: API_ERROR_CODES.FORBIDDEN,
            message: 'This event is no longer accepting feedback submissions.',
          },
        });
        return;
      }

      // 2. Normalize department
      let department: string | null = null;
      if (input.role === 'Student' || input.role === 'Faculty') {
        if (input.department === 'Other') {
          department = input.departmentOther?.trim() || 'Other';
        } else {
          department = input.department || null;
        }
      }

      // 3. Normalize role-specific fields
      const designation = input.role === 'Faculty' ? input.designation?.trim() || null : null;
      const institutionName =
        input.role === 'Other Visitor' ? input.institutionName?.trim() || null : null;

      // 4. Server-side derive and validate public display name
      const publicDisplayName = derivePublicDisplayName(input.name, input.confirmedDisplayName);

      // 5. Color and Pin selection
      const colorVariant =
        input.colorVariant && NOTE_COLORS.includes(input.colorVariant)
          ? input.colorVariant
          : NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

      const pinVariant = PIN_VARIANTS[Math.floor(Math.random() * PIN_VARIANTS.length)];

      const rating = typeof input.rating === 'number' ? Math.max(1, Math.min(5, input.rating)) : 5;

      // 6. Persist with transactional idempotency
      const { note, isDuplicate, isAutoHeld } = await FeedbackRepository.createFeedbackWithLayout({
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
        rating,
        doodleType: input.doodleType || 'check',
        eventId: targetEventId,
      });

      // 7. Emit real-time events if this was a new commit (not an idempotent replay)
      if (!isDuplicate) {
        if (isAutoHeld) {
          // Auto-held for moderation review - emitted to admin socket namespace
          broadcastAdminAutoHeld({
            id: note.id,
            publicDisplayName: note.publicDisplayName,
            role: note.role,
            message: note.message,
            createdAt: note.createdAt,
            eventId: note.eventId,
            event: note.event,
          });
        } else {
          broadcastNewFeedback(note);

          // Fetch and broadcast authoritative stats
          FeedbackRepository.getPublicStats()
            .then((stats) => broadcastStatsUpdated(stats))
            .catch((err) => logger.warn({ err }, 'Failed to broadcast stats after submission'));
        }
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
