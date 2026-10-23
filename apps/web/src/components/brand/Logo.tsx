import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  height?: number;
}

/**
 * DevBappa Solutions Logo Component.
 * Requirement: Use original DevBappa Solutions logo provided by user, unchanged.
 * Place official asset at: apps/web/public/assets/devbappa-logo.png
 * If not yet placed, renders a clearly labeled development placeholder.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', height = 40 }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!imageError ? (
        <img
          src="/assets/devbappa-logo.png"
          alt="DevBappa Solutions"
          style={{ height: `${height}px`, width: 'auto', objectFit: 'contain' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 191, 36, 0.15))',
            border: '1px dashed var(--accent-orange)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
          title="Place official DevBappa Solutions logo at /assets/devbappa-logo.png"
        >
          <span style={{ color: 'var(--accent-orange)' }}>◈</span>
          <span>DevBappa Solutions</span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 4px',
              background: 'rgba(249, 115, 22, 0.2)',
              borderRadius: '3px',
              color: 'var(--accent-yellow)',
            }}
          >
            [Asset Slot]
          </span>
        </div>
      )}
    </div>
  );
};
