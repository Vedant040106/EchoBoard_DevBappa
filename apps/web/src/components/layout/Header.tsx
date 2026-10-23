import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <header
        style={{
          position: 'relative',
          zIndex: 50,
          height: '60px',
          backgroundColor: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        {/* Brand & Product Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo height={30} />
          </Link>
          <div
            className="hidden-on-mobile"
            style={{
              height: '16px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }}
          />
          <span
            className="hidden-on-mobile"
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

          {/* Compact Live Status Dot for Mobile */}
          <div
            className="visible-on-mobile-flex"
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            <span
              className={effectiveStatus === 'LIVE' ? 'live-dot-pulse' : ''}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(),
              }}
            />
            <span style={{ color: getStatusColor() }}>{effectiveStatus}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          >
            + Pin Note
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
          <Link
            to="/admin"
            title="Admin Portal"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-caption)',
              color: location.pathname.startsWith('/admin') ? 'var(--accent-orange)' : 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            🛡️
          </Link>
        </nav>

        {/* Desktop Connection Status and Authoritative Count */}
        <div className="hidden-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          {/* Submissions Counter */}
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

        {/* Mobile Header Right Controls: Compact Count + Hamburger Button */}
        <div className="visible-on-mobile-flex" style={{ alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 'var(--text-caption)',
              fontWeight: 800,
              color: 'var(--accent-yellow)',
            }}
          >
            <span>◈</span>
            <span>{totalSubmissions}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: mobileMenuOpen ? 'var(--accent-orange)' : 'var(--bg-surface-elevated)',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '60px',
            zIndex: 9999,
            backgroundColor: 'rgba(5, 6, 12, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: location.pathname === '/' ? 'var(--accent-orange-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${location.pathname === '/' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-body)',
              }}
            >
              <span>📌</span>
              <span>Live 3D Feedback Wall</span>
            </Link>

            <Link
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-orange)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 'var(--text-body)',
                boxShadow: '0 4px 14px var(--accent-glow)',
              }}
            >
              <span>✍️</span>
              <span>+ Pin Your Feedback</span>
            </Link>

            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: location.pathname === '/history' ? 'var(--accent-orange-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${location.pathname === '/history' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-body)',
              }}
            >
              <span>📜</span>
              <span>Public Feedback History</span>
            </Link>

            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 'var(--text-body)',
              }}
            >
              <span>🛡️</span>
              <span>Admin Moderation Portal</span>
            </Link>

            {/* Event & Connection Card in Drawer */}
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--lh-normal)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>System Status</span>
                <span style={{ color: getStatusColor(), fontWeight: 800 }}>{effectiveStatus}</span>
              </div>
              <div>
                Authoritative Database: <strong>{totalSubmissions} accepted notes</strong>
              </div>
              {queuedCount > 0 && (
                <div style={{ color: '#60a5fa', marginTop: '4px' }}>
                  Device offline queue: {queuedCount} note(s) waiting to sync
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
