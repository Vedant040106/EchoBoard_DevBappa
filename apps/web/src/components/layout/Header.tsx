import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../brand/Logo.js';
import type { ConnectionStatus } from '@devbappa/shared';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  queuedCount: number;
  totalSubmissions: number;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  queuedCount,
  totalSubmissions,
}) => {
  const location = useLocation();

  // Determine effective display status
  let effectiveStatus: string = connectionStatus;
  if (queuedCount > 0) {
    effectiveStatus = 'WAITING TO SYNC';
  }

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'LIVE':
        return '#10b981';
      case 'WAITING TO SYNC':
        return '#3b82f6';
      case 'RECONNECTING':
        return '#f59e0b';
      case 'OFFLINE':
      default:
        return '#ef4444';
    }
  };

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 50,
        height: '64px',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Brand & Product Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo height={34} />
        </Link>
        <div
          style={{
            height: '18px',
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'var(--text-body)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}
        >
          Live Feedback Wall
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link
          to="/"
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-caption)',
            fontWeight: location.pathname === '/' ? 700 : 500,
            color: location.pathname === '/' ? '#ffffff' : 'var(--text-secondary)',
            backgroundColor:
              location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border:
              location.pathname === '/'
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Wall
        </Link>
        <Link
          to="/submit"
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-caption)',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: 'var(--accent-orange)',
            textDecoration: 'none',
            boxShadow: '0 2px 10px var(--accent-glow)',
            transition: 'background-color 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-orange-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-orange)';
          }}
        >
          + Submit
        </Link>
        <Link
          to="/history"
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-caption)',
            fontWeight: location.pathname === '/history' ? 700 : 500,
            color: location.pathname === '/history' ? '#ffffff' : 'var(--text-secondary)',
            backgroundColor:
              location.pathname === '/history' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border:
              location.pathname === '/history'
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          History
        </Link>
      </nav>

      {/* Live Status and Authoritative Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Connection Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 'var(--text-micro)',
            fontWeight: 800,
            letterSpacing: '0.05em',
          }}
        >
          <span
            className={effectiveStatus === 'LIVE' ? 'live-dot-pulse' : ''}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 10px ${getStatusColor()}`,
            }}
          />
          <span style={{ color: getStatusColor() }}>{effectiveStatus}</span>
          {queuedCount > 0 && (
            <span
              style={{
                marginLeft: '2px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {queuedCount}
            </span>
          )}
        </div>

        {/* Authoritative Submissions Counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          title="Authoritative accepted submissions count from database"
        >
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            TOTAL
          </span>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'var(--text-body)',
              fontWeight: 800,
              color: 'var(--accent-yellow)',
            }}
          >
            {totalSubmissions}
          </span>
        </div>
      </div>
    </header>
  );
};
