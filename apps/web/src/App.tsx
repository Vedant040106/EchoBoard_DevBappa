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

      // Highlight new note animation
      setNewNoteId(incomingNote.id);
      setTimeout(() => setNewNoteId(null), 3000);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Header
        connectionStatus={connectionStatus}
        queuedCount={queuedCount}
        totalSubmissions={totalSubmissions}
      />
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
