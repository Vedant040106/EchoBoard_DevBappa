import React from 'react';
import type { PublicFeedbackNote } from '@devbappa/shared';

interface StickyNoteProps {
  note: PublicFeedbackNote;
  isNew?: boolean;
  onClick: (note: PublicFeedbackNote) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = React.memo(({ note, isNew = false, onClick }) => {
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
    layout,
  } = note;

  const colorClass = `note-${colorVariant || 'yellow'}`;
  const pinClass = `pushpin-${pinVariant || 'brass'}`;

  // Subtitle info
  let subtitle = '';
  if (role === 'Student') {
    subtitle = department || 'Student';
  } else if (role === 'Faculty') {
    subtitle = [designation, department].filter(Boolean).join(' • ') || 'Faculty';
  } else {
    subtitle = institutionName || 'Visitor';
  }

  // Format relative/short time
  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      className={`sticky-note ${colorClass} ${isNew ? 'animate-settle' : ''}`}
      style={{
        width: `${layout.width || 240}px`,
        minHeight: `${layout.height || 240}px`,
        transform: `translate3d(${layout.worldX}px, ${layout.worldY}px, 0) rotate(${layout.rotation || 0}deg)`,
        zIndex: layout.layerOrder || 1,
        // Custom property for CSS keyframes
        ['--target-rotation' as any]: `${layout.rotation || 0}deg`,
      }}
      onClick={() => onClick(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(note);
        }
      }}
      aria-label={`Feedback note from ${publicDisplayName}, ${role}`}
    >
      {/* 3D Realistic Pushpin */}
      <div className={`pushpin ${pinClass}`} />

      {/* Note Header / Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'var(--text-body)',
              fontWeight: 700,
              lineHeight: 'var(--lh-tight)',
              color: 'var(--note-ink-primary)',
            }}
          >
            {publicDisplayName}
          </span>
          <span
            style={{
              fontSize: 'var(--text-micro)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              color: 'var(--note-ink-secondary)',
            }}
          >
            {role}
          </span>
        </div>
        {subtitle && (
          <span
            style={{
              fontSize: 'var(--text-caption)',
              fontWeight: 600,
              color: 'var(--note-ink-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Note Feedback Message (Handwritten & Physical Ink) */}
      <div
        style={{
          fontFamily: 'var(--font-handwriting)',
          fontSize: 'clamp(19px, 1.35vw, 23px)',
          lineHeight: '1.25',
          fontWeight: 700,
          flex: 1,
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--note-ink-primary)',
          letterSpacing: '0.01em',
        }}
      >
        "{message}"
      </div>

      {/* Note Footer Timestamp */}
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: 'var(--text-micro)',
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: 'var(--note-ink-meta)',
        }}
      >
        {formattedDate}
      </div>
    </div>
  );
});
