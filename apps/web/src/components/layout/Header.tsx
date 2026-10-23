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
        height: '60px',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      {/* Brand & Product */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo height={34} />
        </Link>
        <div
          style={{
            height: '20px',
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Live Feedback Wall
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          to="/"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            color: location.pathname === '/' ? '#fff' : 'var(--text-secondary)',
            backgroundColor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          Wall
        </Link>
        <Link
          to="/submit"
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: 'var(--accent-orange)',
            textDecoration: 'none',
            boxShadow: '0 2px 8px var(--accent-glow)',
            transition: 'background-color 0.2s ease',
          }}
        >
          + Submit
        </Link>
        <Link
          to="/history"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            color: location.pathname === '/history' ? '#fff' : 'var(--text-secondary)',
            backgroundColor:
              location.pathname === '/history' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          History
        </Link>
      </nav>

      {/* Live Status and Authoritative Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Connection Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 8px ${getStatusColor()}`,
            }}
          />
          <span style={{ color: getStatusColor() }}>{effectiveStatus}</span>
          {queuedCount > 0 && (
            <span
              style={{
                marginLeft: '2px',
                padding: '1px 5px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                fontSize: '10px',
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
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          title="Authoritative accepted submissions count from database"
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total:
          </span>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '14px',
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
