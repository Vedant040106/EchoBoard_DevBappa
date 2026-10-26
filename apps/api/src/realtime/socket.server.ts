import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AdminRepository } from '../db/repositories/admin.repository.js';
import {
  REALTIME_EVENTS,
  type PublicFeedbackNote,
  type PublicStats,
  type CanvasNoteLayout,
  type PublicEvent,
} from '@devbappa/shared';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', async (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'Client connected to realtime socket');

    // Check if client is an authenticated admin via handshake auth token
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (typeof token === 'string' && token) {
      try {
        const session = await AdminRepository.findValidSession(token);
        if (session) {
          socket.join('admin-room');
          logger.debug({ socketId: socket.id, adminId: session.admin_id }, 'Socket joined admin room');
        }
      } catch (err) {
        logger.warn({ err, socketId: socket.id }, 'Admin socket authentication check failed');
      }
    }

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Client disconnected from realtime socket');
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Broadcasts a new public feedback note to all connected clients.
 * MUST be called only AFTER the database transaction commits!
 */
export function broadcastNewFeedback(note: PublicFeedbackNote): void {
  if (!io) return;
  // Ensure private fields (like full_name) are never present in public payload
  const publicPayload: PublicFeedbackNote = {
    id: note.id,
    publicDisplayName: note.publicDisplayName,
    role: note.role,
    department: note.department,
    designation: note.designation,
    institutionName: note.institutionName,
    message: note.message,
    rating: note.rating,
    doodleType: note.doodleType,
    eventId: note.eventId,
    event: note.event,
    createdAt: note.createdAt,
    colorVariant: note.colorVariant,
    pinVariant: note.pinVariant,
    sizeVariant: note.sizeVariant,
    layout: note.layout,
  };
  io.emit(REALTIME_EVENTS.FEEDBACK_NEW, publicPayload);
}

export function broadcastAdminAutoHeld(item: unknown): void {
  if (!io) return;
  io.to('admin-room').emit('admin:auto_held', item);
}

export function broadcastFeedbackHidden(id: string): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_HIDDEN, { id });
}

export function broadcastFeedbackRestored(note: PublicFeedbackNote): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_RESTORED, note);
}

export function broadcastFeedbackDeleted(id: string): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_DELETED, { id });
}

export function broadcastStatsUpdated(stats: PublicStats): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.STATS_UPDATED, stats);
}

export function broadcastLayoutUpdated(feedbackId: string, layout: CanvasNoteLayout): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.LAYOUT_UPDATED, { feedbackId, layout });
}

export function broadcastWallEventsUpdated(wallEvents: PublicEvent[]): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.WALL_EVENTS_UPDATED, { wallEvents });
}
