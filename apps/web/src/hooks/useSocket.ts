import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  REALTIME_EVENTS,
  CONNECTION_STATUS,
  type ConnectionStatus,
  type PublicFeedbackNote,
  type PublicStats,
  type CanvasNoteLayout,
  type PublicEvent,
} from '@devbappa/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

interface UseSocketOptions {
  onNewFeedback?: (note: PublicFeedbackNote) => void;
  onFeedbackHidden?: (id: string) => void;
  onFeedbackRestored?: (note: PublicFeedbackNote) => void;
  onFeedbackDeleted?: (id: string) => void;
  onStatsUpdated?: (stats: PublicStats) => void;
  onLayoutUpdated?: (data: { feedbackId: string; layout: CanvasNoteLayout }) => void;
  onWallEventsUpdated?: (data: { wallEvents: PublicEvent[] }) => void;
  onReconnect?: () => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    CONNECTION_STATUS.OFFLINE
  );
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Detect initial online/offline state
    if (!navigator.onLine) {
      setConnectionStatus(CONNECTION_STATUS.OFFLINE);
    }

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus(CONNECTION_STATUS.LIVE);
      optionsRef.current.onReconnect?.();
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
      } else {
        setConnectionStatus(CONNECTION_STATUS.OFFLINE);
      }
    });

    socket.on('connect_error', () => {
      setConnectionStatus(
        navigator.onLine ? CONNECTION_STATUS.RECONNECTING : CONNECTION_STATUS.OFFLINE
      );
    });

    socket.on(REALTIME_EVENTS.FEEDBACK_NEW, (note: PublicFeedbackNote) => {
      optionsRef.current.onNewFeedback?.(note);
    });

    socket.on(REALTIME_EVENTS.FEEDBACK_HIDDEN, ({ id }: { id: string }) => {
      optionsRef.current.onFeedbackHidden?.(id);
    });

    socket.on(REALTIME_EVENTS.FEEDBACK_RESTORED, (note: PublicFeedbackNote) => {
      optionsRef.current.onFeedbackRestored?.(note);
    });

    socket.on(REALTIME_EVENTS.FEEDBACK_DELETED, ({ id }: { id: string }) => {
      optionsRef.current.onFeedbackDeleted?.(id);
    });

    socket.on(REALTIME_EVENTS.STATS_UPDATED, (stats: PublicStats) => {
      optionsRef.current.onStatsUpdated?.(stats);
    });

    socket.on(REALTIME_EVENTS.LAYOUT_UPDATED, (data: { feedbackId: string; layout: CanvasNoteLayout }) => {
      optionsRef.current.onLayoutUpdated?.(data);
    });

    socket.on(REALTIME_EVENTS.WALL_EVENTS_UPDATED, (data: { wallEvents: PublicEvent[] }) => {
      optionsRef.current.onWallEventsUpdated?.(data);
    });

    const handleWindowOnline = () => {
      setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
      socket.connect();
    };

    const handleWindowOffline = () => {
      setConnectionStatus(CONNECTION_STATUS.OFFLINE);
    };

    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);

    return () => {
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('offline', handleWindowOffline);
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    connectionStatus,
  };
}
