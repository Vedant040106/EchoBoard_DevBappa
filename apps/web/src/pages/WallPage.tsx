import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PublicFeedbackNote } from '@devbappa/shared';
import { ThreePinboardCanvas } from '../components/wall/ThreePinboardCanvas.js';
import { NoteDetailModal } from '../components/sticky-note/NoteDetailModal.js';

interface WallPageProps {
  notes: PublicFeedbackNote[];
  newNoteId: string | null;
  onRefreshNotes: () => void;
}

export const WallPage: React.FC<WallPageProps> = ({ notes, newNoteId }) => {
  const navigate = useNavigate();
  const [selectedNote, setSelectedNote] = useState<PublicFeedbackNote | null>(null);

  const handleSelectNote = useCallback((note: PublicFeedbackNote) => {
    setSelectedNote(note);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedNote(null);
  }, []);

  return (
    <main
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#090a10',
      }}
    >
      {/* Immersive 3D Spatial Feedback Wall */}
      <ThreePinboardCanvas
        notes={notes}
        newNoteId={newNoteId}
        onSelectNote={handleSelectNote}
      />

      {/* Mobile Floating Action Button (FAB) for fast feedback submission */}
      <div
        className="visible-on-mobile-flex"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '20px',
          zIndex: 45,
        }}
      >
        <button
          onClick={() => navigate('/submit')}
          aria-label="Pin new feedback note"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '48px',
            padding: '0 20px',
            backgroundColor: 'var(--accent-orange)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            color: '#ffffff',
            fontSize: 'var(--text-body)',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 20px var(--accent-glow)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          <span>Pin Note</span>
        </button>
      </div>

      {/* Accessible Detail Modal Overlay */}
      <NoteDetailModal note={selectedNote} onClose={handleCloseModal} />
    </main>
  );
};

