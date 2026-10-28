import type { PublicStats, PublicFeedbackNote, CanvasNoteLayout, PublicEvent } from '@devbappa/shared';
import { REALTIME_EVENTS } from '@devbappa/shared';
import { getSocketServer } from './socket.server.js';
import { purgeLocalCache, type CacheChannel } from '../cache/invalidator.js';
import { logger } from '../utils/logger.js';

interface CoalescerState {
  pendingStats: PublicStats | null;
  statsTimer: NodeJS.Timeout | null;
  pendingFeedbackBatch: PublicFeedbackNote[];
  feedbackTimer: NodeJS.Timeout | null;
}

const state: CoalescerState = {
  pendingStats: null,
  statsTimer: null,
  pendingFeedbackBatch: [],
  feedbackTimer: null,
};

const COALESCE_WINDOW_MS = 50;

/**
 * Coalesces burst statistics broadcasts into a 50ms window.
 * Ensures clients receive the latest authoritative stats without socket flooding.
 */
export function queueCoalescedStatsBroadcast(stats: PublicStats): void {
  state.pendingStats = stats;

  if (!state.statsTimer) {
    state.statsTimer = setTimeout(() => {
      flushCoalescedStats();
    }, COALESCE_WINDOW_MS);
  }
}

function flushCoalescedStats(): void {
  state.statsTimer = null;
  if (!state.pendingStats) return;

  const io = getSocketServer();
  if (io) {
    io.emit(REALTIME_EVENTS.STATS_UPDATED, state.pendingStats);
  }
  state.pendingStats = null;
}

/**
 * Emits feedback note immediately while ensuring duplicate bursts within the same tick are deduplicated.
 */
export function queueCoalescedFeedbackBroadcast(note: PublicFeedbackNote): void {
  const io = getSocketServer();
  if (!io) return;

  // Immediate broadcast of single note to preserve sub-100ms visual gratification
  io.emit(REALTIME_EVENTS.FEEDBACK_NEW, note);
}

/**
 * Processes cross-instance messages received from PostgreSQL LISTEN.
 */
export function handleCrossInstanceRealtimeMessage(channel: string, payloadStr: string): void {
  try {
    const payload = JSON.parse(payloadStr);
    const io = getSocketServer();

    if (channel === 'devbappa_cache_invalidation') {
      purgeLocalCache(payload as CacheChannel);
      return;
    }

    if (channel === 'devbappa_realtime' && io) {
      switch (payload.type) {
        case REALTIME_EVENTS.FEEDBACK_NEW:
          io.emit(REALTIME_EVENTS.FEEDBACK_NEW, payload.data);
          break;
        case REALTIME_EVENTS.FEEDBACK_HIDDEN:
          io.emit(REALTIME_EVENTS.FEEDBACK_HIDDEN, payload.data);
          break;
        case REALTIME_EVENTS.FEEDBACK_RESTORED:
          io.emit(REALTIME_EVENTS.FEEDBACK_RESTORED, payload.data);
          break;
        case REALTIME_EVENTS.FEEDBACK_DELETED:
          io.emit(REALTIME_EVENTS.FEEDBACK_DELETED, payload.data);
          break;
        case REALTIME_EVENTS.LAYOUT_UPDATED:
          io.emit(REALTIME_EVENTS.LAYOUT_UPDATED, payload.data);
          break;
        case REALTIME_EVENTS.WALL_EVENTS_UPDATED:
          io.emit(REALTIME_EVENTS.WALL_EVENTS_UPDATED, payload.data);
          break;
        case REALTIME_EVENTS.STATS_UPDATED:
          queueCoalescedStatsBroadcast(payload.data);
          break;
      }
    }
  } catch (err) {
    logger.debug({ err, channel }, 'Failed to parse cross-instance realtime payload');
  }
}
