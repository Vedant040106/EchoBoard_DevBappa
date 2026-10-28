import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AdminRepository } from '../db/repositories/admin.repository.js';
import { pool } from '../db/index.js';
import {
  REALTIME_EVENTS,
  type PublicFeedbackNote,
  type PublicStats,
  type CanvasNoteLayout,
  type PublicEvent,
} from '@devbappa/shared';
import {
  queueCoalescedStatsBroadcast,
  handleCrossInstanceRealtimeMessage,
} from './batch-emitter.js';

let io: SocketIOServer | null = null;
let listenClient: pg.Client | null = null;

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

  // Setup cross-instance / cluster synchronization via PostgreSQL LISTEN on direct connection
  initPgListener().catch((err) => {
    logger.debug({ err }, 'PG LISTEN initialization skipped or running single-instance mode');
  });

  return io;
}

async function initPgListener(): Promise<void> {
  const isNeonOrCloud =
    config.databaseUrlUnpooled.includes('neon.tech') ||
    config.databaseUrlUnpooled.includes('sslmode=require') ||
    config.isProduction;

  listenClient = new pg.Client({
    connectionString: config.databaseUrlUnpooled,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : undefined,
    keepAlive: true,
  });

  try {
    await listenClient.connect();
    await listenClient.query('LISTEN devbappa_realtime');
    await listenClient.query('LISTEN devbappa_cache_invalidation');

    listenClient.on('notification', (msg) => {
      if (msg.channel && msg.payload) {
        handleCrossInstanceRealtimeMessage(msg.channel, msg.payload);
      }
    });

    listenClient.on('error', (err) => {
      logger.debug({ err }, 'PG LISTEN connection encountered error');
    });

    logger.info('Cross-instance PostgreSQL LISTEN/NOTIFY synchronization established');
  } catch (err) {
    logger.debug({ err }, 'Could not initialize cross-instance LISTEN client; continuing in standalone mode');
    listenClient = null;
  }
}

async function publishRealtimeEvent(type: string, data: unknown): Promise<void> {
  try {
    const payload = JSON.stringify({ type, data });
    await pool.query('SELECT pg_notify($1, $2)', ['devbappa_realtime', payload]);
  } catch {
    // Non-fatal if DB is single instance or in test
  }
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export async function closeSocketServer(): Promise<void> {
  if (listenClient) {
    try {
      await listenClient.end();
    } catch {
      // Ignored
    }
    listenClient = null;
  }
  if (io) {
    io.close();
    io = null;
  }
}

/**
 * Broadcasts a new public feedback note to all connected clients.
 * MUST be called only AFTER the database transaction commits!
 */
export function broadcastNewFeedback(note: PublicFeedbackNote): void {
  if (!io) return;
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
  publishRealtimeEvent(REALTIME_EVENTS.FEEDBACK_NEW, publicPayload).catch(() => {});
}

export function broadcastAdminAutoHeld(item: unknown): void {
  if (!io) return;
  io.to('admin-room').emit('admin:auto_held', item);
}

export function broadcastFeedbackHidden(id: string): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_HIDDEN, { id });
  publishRealtimeEvent(REALTIME_EVENTS.FEEDBACK_HIDDEN, { id }).catch(() => {});
}

export function broadcastFeedbackRestored(note: PublicFeedbackNote): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_RESTORED, note);
  publishRealtimeEvent(REALTIME_EVENTS.FEEDBACK_RESTORED, note).catch(() => {});
}

export function broadcastFeedbackDeleted(id: string): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.FEEDBACK_DELETED, { id });
  publishRealtimeEvent(REALTIME_EVENTS.FEEDBACK_DELETED, { id }).catch(() => {});
}

export function broadcastStatsUpdated(stats: PublicStats): void {
  if (!io) return;
  queueCoalescedStatsBroadcast(stats);
  publishRealtimeEvent(REALTIME_EVENTS.STATS_UPDATED, stats).catch(() => {});
}

export function broadcastLayoutUpdated(feedbackId: string, layout: CanvasNoteLayout): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.LAYOUT_UPDATED, { feedbackId, layout });
  publishRealtimeEvent(REALTIME_EVENTS.LAYOUT_UPDATED, { feedbackId, layout }).catch(() => {});
}

export function broadcastWallEventsUpdated(wallEvents: PublicEvent[]): void {
  if (!io) return;
  io.emit(REALTIME_EVENTS.WALL_EVENTS_UPDATED, { wallEvents });
  publishRealtimeEvent(REALTIME_EVENTS.WALL_EVENTS_UPDATED, { wallEvents }).catch(() => {});
}
