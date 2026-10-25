import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { PublicFeedbackNote, PublicStats, CanvasNoteLayout } from '@devbappa/shared';
import { api } from './services/api.js';
import { useSocket } from './hooks/useSocket.js';
import { useOfflineQueue } from './hooks/useOfflineQueue.js';
import { Header } from './components/layout/Header.js';
import { WallPage } from './pages/WallPage.js';
import { FeedbackForm } from './features/submission/FeedbackForm.js';
import { PublicHistory } from './features/history/PublicHistory.js';
import { AdminLogin } from './features/admin/AdminLogin.js';
import { AdminDashboard } from './features/admin/AdminDashboard.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<PublicFeedbackNote[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [thankYouToast, setThankYouToast] = useState<{ displayName: string } | null>(null);

  // Fetch initial notes and authoritative statistics
  const refreshData = useCallback(async () => {
    try {
      const [notesData, statsData] = await Promise.all([
        api.getPublicNotes(),
        api.getPublicStats().catch(() => null),
      ]);
      setNotes(notesData);
      if (statsData) {
        setTotalSubmissions(statsData.totalAccepted);
      }
    } catch {
      // Backend might be starting up or currently unreachable
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Offline submission queue hook
  const { queuedCount, syncQueue } = useOfflineQueue(() => {
    refreshData();
  });

  // Socket.IO real-time hook
  const { connectionStatus } = useSocket({
    onNewFeedback: (incomingNote) => {
      setNotes((prev) => {
        // Deduplicate by record ID
        if (prev.some((n) => n.id === incomingNote.id)) {
          return prev;
        }
        return [...prev, incomingNote];
      });

      // Highlight new note animation and show live thank you banner
      setNewNoteId(incomingNote.id);
      setThankYouToast({ displayName: incomingNote.publicDisplayName });
      setTimeout(() => setNewNoteId(null), 3500);
      setTimeout(() => setThankYouToast(null), 5000);
    },
    onFeedbackHidden: (id) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    onFeedbackRestored: (restoredNote) => {
      setNotes((prev) => {
        const index = prev.findIndex((n) => n.id === restoredNote.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = restoredNote;
          return updated;
        }
        return [...prev, restoredNote];
      });
    },
    onFeedbackDeleted: (id) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    onStatsUpdated: (stats: PublicStats) => {
      setTotalSubmissions(stats.totalAccepted);
    },
    onLayoutUpdated: ({ feedbackId, layout }: { feedbackId: string; layout: CanvasNoteLayout }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === feedbackId ? { ...n, layout: { ...n.layout, ...layout } } : n))
      );
    },
    onReconnect: () => {
      refreshData();
      syncQueue();
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <Header
        connectionStatus={connectionStatus}
        queuedCount={queuedCount}
        totalSubmissions={totalSubmissions}
      />
      {thankYouToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 22px',
            backgroundColor: 'rgba(15, 17, 28, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(249, 115, 22, 0.5)',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(249, 115, 22, 0.3)',
            color: '#ffffff',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 700,
            maxWidth: '92vw',
            textAlign: 'center',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>
            Thank you, <span style={{ color: '#fb923c' }}>{thankYouToast.displayName}</span>! Team DevBappa appreciates your feedback.
          </span>
        </div>
      )}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route
            path="/"
            element={
              <WallPage
                notes={notes}
                newNoteId={newNoteId}
                onRefreshNotes={refreshData}
              />
            }
          />
          <Route path="/submit" element={<FeedbackForm />} />
          <Route path="/history" element={<PublicHistory />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
};
