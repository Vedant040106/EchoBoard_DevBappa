import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  createEventSchema,
  updateEventSchema,
  wallSelectionSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type WallSelectionInput,
  API_ERROR_CODES,
} from '@devbappa/shared';
import { validateBody } from '../../middleware/validate.middleware.js';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';
import { EventRepository } from '../../db/repositories/event.repository.js';
import { FeedbackRepository } from '../../db/repositories/feedback.repository.js';
import { AuditRepository } from '../../db/repositories/audit.repository.js';
import {
  broadcastWallEventsUpdated,
  broadcastStatsUpdated,
} from '../../realtime/socket.server.js';
import { logger } from '../../utils/logger.js';
import { swrRoute } from '../../cache/swr-cache.js';
import { invalidateEventsCache } from '../../cache/invalidator.js';

export const publicEventRouter = Router();
export const adminEventRouter = Router();

// GET /api/v1/events/public (TTL: 5s, SWR: 15s)
publicEventRouter.get(
  '/public',
  swrRoute(
    () => 'events:public',
    5,
    15,
    async () => EventRepository.getPublicEvents()
  )
);

// GET /api/v1/admin/events
adminEventRouter.get('/', requireAdminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await EventRepository.getAllAdminEvents();
    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/events
adminEventRouter.post(
  '/',
  requireAdminAuth,
  validateBody(createEventSchema),
  async (req: Request<{}, {}, CreateEventInput>, res: Response, next: NextFunction) => {
    try {
      const input = req.body;
      const created = await EventRepository.createEvent(input);

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        eventId: created.id,
        action: 'EVENT_CREATED',
        newState: input as unknown as Record<string, unknown>,
        correlationId: req.correlationId,
      });

      // If created with isDisplayedOnWall = true, broadcast wall update
      if (created.isDisplayedOnWall) {
        const wallEvents = await EventRepository.getActiveWallEvents();
        broadcastWallEventsUpdated(wallEvents);
        FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});
      }

      // Invalidate events and stats caches
      await invalidateEventsCache();

      logger.info({ eventId: created.id, name: created.name }, 'Admin created event');

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/admin/events/wall-selection
adminEventRouter.put(
  '/wall-selection',
  requireAdminAuth,
  validateBody(wallSelectionSchema),
  async (req: Request<{}, {}, WallSelectionInput>, res: Response, next: NextFunction) => {
    try {
      const { eventIds } = req.body;

      // Fetch previous wall selection for audit
      const previousWallEvents = await EventRepository.getActiveWallEvents();
      const previousIds = previousWallEvents.map((e) => e.id);

      const activeWallEvents = await EventRepository.setWallSelection(eventIds);

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        action: 'EVENT_WALL_SELECTION_CHANGED',
        previousState: { wallEventIds: previousIds },
        newState: { wallEventIds: eventIds },
        correlationId: req.correlationId,
      });

      // Broadcast immediately over Socket.IO
      broadcastWallEventsUpdated(activeWallEvents);
      FeedbackRepository.getPublicStats()
        .then(broadcastStatsUpdated)
        .catch((err) => logger.warn({ err }, 'Failed to broadcast stats after wall selection change'));

      // Invalidate events and stats caches
      await invalidateEventsCache();

      logger.info({ eventIds }, 'Admin updated wall events selection');

      res.json({
        success: true,
        data: {
          activeWallEvents,
          selectedCount: activeWallEvents.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/admin/events/:id
adminEventRouter.patch(
  '/:id',
  requireAdminAuth,
  validateBody(updateEventSchema),
  async (req: Request<{ id: string }, {}, UpdateEventInput>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = req.body;

      const previous = await EventRepository.getAdminEventById(id);
      if (!previous) {
        res.status(404).json({
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Event not found',
          },
        });
        return;
      }

      const updated = await EventRepository.updateEvent(id, input);

      // Record audit
      await AuditRepository.recordEvent({
        adminId: req.adminId || 'unknown',
        eventId: id,
        action: 'EVENT_UPDATED',
        previousState: previous as unknown as Record<string, unknown>,
        newState: input as unknown as Record<string, unknown>,
        correlationId: req.correlationId,
      });

      // If display flag or details changed, update realtime wall
      if (
        input.isDisplayedOnWall !== undefined ||
        input.name !== undefined ||
        input.venue !== undefined ||
        input.eventDate !== undefined
      ) {
        const wallEvents = await EventRepository.getActiveWallEvents();
        broadcastWallEventsUpdated(wallEvents);
        FeedbackRepository.getPublicStats().then(broadcastStatsUpdated).catch(() => {});
      }

      // Invalidate events and stats caches
      await invalidateEventsCache();

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);
