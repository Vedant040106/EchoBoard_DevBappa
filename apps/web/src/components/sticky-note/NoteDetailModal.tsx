import React, { useEffect, useRef } from 'react';
import type { PublicFeedbackNote } from '@devbappa/shared';

interface NoteDetailModalProps {
  note: PublicFeedbackNote | null;
  onClose: () => void;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
    rating = 5,
    event,
    createdAt,
    colorVariant,
  } = note;

  const colorClass = `note-${colorVariant || 'yellow'}`;

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const eventName = event?.name || 'Tech Expo';
  const eventDateFormatted = formatDisplayDate(event?.eventDate || '2026-10-23');
  const eventVenue = event?.venue || 'VPPCOE&VA, Sion';

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
          maxWidth: '540px',
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
        {/* Top Adhesive Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            pointerEvents: 'none',
          }}
        />

        {/* Hand-Drawn Doodle Watermark Stamp */}
        {note.doodleType && note.doodleType !== 'none' && (
          <div
            style={{
              position: 'absolute',
              bottom: '36px',
              right: '28px',
              width: '120px',
              height: '120px',
              opacity: 0.12,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-8deg)',
              color: 'var(--note-ink-primary)',
            }}
          >
            {note.doodleType === 'lightning' ? (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            ) : note.doodleType === 'heart' ? (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : note.doodleType === 'spark' ? (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            ) : note.doodleType === 'spiral' ? (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 7.5 7.5 0 1 0-7.5-7.5 5 5 0 1 0 5 5 2.5 2.5 0 1 0-2.5-2.5" />
              </svg>
            ) : note.doodleType === 'lightbulb' ? (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7z" />
              </svg>
            ) : (
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        )}

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
        <div style={{ marginBottom: '18px' }}>
          {/* Rating Stars Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
            }}
            aria-label={`Overall Experience Rating: ${rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={star <= rating ? '#f59e0b' : 'none'}
                stroke={star <= rating ? '#d97706' : 'rgba(26, 22, 43, 0.35)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--note-ink-secondary)',
                marginLeft: '4px',
              }}
            >
              {rating}.0 / 5.0
            </span>
          </div>

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

          {/* Event Badge Details (Event Name, Event Date, Venue) */}
          <div
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: 'rgba(26, 22, 43, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--note-ink-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <strong style={{ color: 'var(--note-ink-primary)' }}>{eventName}</strong>
            <span style={{ color: 'var(--note-ink-meta)' }}>•</span>
            <span>{eventDateFormatted}</span>
            <span style={{ color: 'var(--note-ink-meta)' }}>•</span>
            <span style={{ color: 'var(--note-ink-secondary)' }}>{eventVenue}</span>
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
          <span>DevBappa Solutions Note</span>
          <time dateTime={createdAt}>{formattedDate}</time>
        </div>
      </div>
    </div>
  );
};
