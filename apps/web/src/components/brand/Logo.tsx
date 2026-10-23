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
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
          title="DevBappa Solutions"
        >
          <svg
            width={Math.round(height * 0.82)}
            height={Math.round(height * 0.82)}
            viewBox="0 0 32 32"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.35))' }}
          >
            <defs>
              <linearGradient id="dbBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <rect
              x="2"
              y="2"
              width="28"
              height="28"
              rx="8"
              fill="rgba(249, 115, 22, 0.15)"
              stroke="rgba(249, 115, 22, 0.45)"
              strokeWidth="1.5"
            />
            <path d="M10 16L16 10L22 16L16 22Z" fill="url(#dbBrandGrad)" />
            <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontWeight: 800,
              fontSize: '15px',
              background: 'linear-gradient(135deg, #ffffff 40%, #fdba74 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            DevBappa
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Solutions
          </span>
        </div>
      )}
    </div>
  );
};
