import React, { useState, useCallback } from 'react';
import type { PublicFeedbackNote } from '@devbappa/shared';
import { PinboardCanvas } from '../components/wall/PinboardCanvas.js';
import { NoteDetailModal } from '../components/sticky-note/NoteDetailModal.js';

interface WallPageProps {
  notes: PublicFeedbackNote[];
  newNoteId: string | null;
  onRefreshNotes: () => void;
}

export const WallPage: React.FC<WallPageProps> = ({ notes, newNoteId }) => {
  const [selectedNote, setSelectedNote] = useState<PublicFeedbackNote | null>(null);

  const handleSelectNote = useCallback((note: PublicFeedbackNote) => {
    setSelectedNote(note);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedNote(null);
  }, []);

  return (
    <main style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <PinboardCanvas
        notes={notes}
        newNoteId={newNoteId}
        onSelectNote={handleSelectNote}
      />
      <NoteDetailModal note={selectedNote} onClose={handleCloseModal} />
    </main>
  );
};
