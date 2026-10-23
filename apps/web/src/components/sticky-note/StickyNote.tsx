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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '15px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {publicDisplayName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {role}
          </span>
        </div>
        {subtitle && (
          <span
            style={{
              fontSize: '11px',
              opacity: 0.8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Note Feedback Message */}
      <div
        style={{
          fontFamily: 'var(--font-handwriting)',
          fontSize: '20px',
          lineHeight: '1.3',
          fontWeight: 700,
          flex: 1,
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
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
          fontSize: '11px',
          fontWeight: 600,
          opacity: 0.65,
        }}
      >
        {formattedDate}
      </div>
    </div>
  );
});
