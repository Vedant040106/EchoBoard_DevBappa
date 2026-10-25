import React, { useEffect, useRef } from 'react';
import type { PublicFeedbackNote } from '@devbappa/shared';

interface NoteDetailModalProps {
  note: PublicFeedbackNote | null;
  onClose: () => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!note) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [note, onClose]);

  if (!note) return null;

  const {
    publicDisplayName,
    role,
    department,
    designation,
    institutionName,
    message,
    createdAt,
    colorVariant,
    pinVariant,
  } = note;

  const colorClass = `note-${colorVariant || 'yellow'}`;
  const pinClass = `pushpin-${pinVariant || 'brass'}`;

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 6, 12, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${colorClass}`}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '4px 4px 16px 4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          padding: '36px 32px 28px 32px',
          transform: 'rotate(-0.5deg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.6)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.4)',
          color: 'var(--note-ink-primary)',
        }}
      >
        {/* Realistic Pushpin */}
        <div className={`pushpin ${pinClass}`} style={{ top: '-10px' }} />

        {/* Accessible Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close note inspection"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            color: 'var(--note-ink-primary)',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Note Meta */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2
              id="note-modal-title"
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 'var(--text-title-md)',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--note-ink-primary)',
              }}
            >
              {publicDisplayName}
            </h2>
            <span
              style={{
                fontSize: 'var(--text-micro)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                color: 'var(--note-ink-secondary)',
              }}
            >
              {role}
            </span>
          </div>

          <div
            style={{
              marginTop: '6px',
              fontSize: 'var(--text-caption)',
              color: 'var(--note-ink-secondary)',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {role === 'Faculty' && designation && <span>Designation: {designation}</span>}
            {department && <span>Department: {department}</span>}
            {institutionName && <span>Institution: {institutionName}</span>}
          </div>
        </div>

        {/* Feedback Message */}
        <div
          style={{
            fontFamily: 'var(--font-handwriting)',
            fontSize: '24px',
            lineHeight: 'var(--lh-normal)',
            fontWeight: 700,
            color: 'var(--note-ink-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: '20px 0',
          }}
        >
          "{message}"
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-caption)',
            fontWeight: 600,
            color: 'var(--note-ink-meta)',
          }}
        >
          <span>DevBappa Expo Note</span>
          <time dateTime={createdAt}>{formattedDate}</time>
        </div>
      </div>
    </div>
  );
};
