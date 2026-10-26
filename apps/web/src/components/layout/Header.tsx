import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../brand/Logo.js';
import type { ConnectionStatus, PublicEvent } from '@devbappa/shared';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  queuedCount: number;
  totalSubmissions: number;
  activeWallEvents?: PublicEvent[];
  averageRating?: number;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  queuedCount,
  totalSubmissions,
  activeWallEvents = [],
  averageRating = 5.0,
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);

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
          height: '56px',
          backgroundColor: 'rgba(22, 28, 88, 0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* Left: Original DevBappa Solutions Logo + EchoBoard Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/"
            id="header-devbappa-logo"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo height={28} />
          </Link>
          <div
            style={{
              height: '14px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
          />
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--font-brand)',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>EchoBoard</span>
          </Link>

          {/* Compact Live Status Badge for Mobile Header */}
          <div
            className="visible-on-mobile-flex"
            style={{
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
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

        {/* Center: Active Wall Event Badge or Multi-Event Pill */}
        <div className="hidden-on-mobile" style={{ position: 'relative' }}>
          {activeWallEvents.length === 1 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(15, 17, 28, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f08035" strokeWidth="2.4">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>
                {activeWallEvents[0].name} • {formatDisplayDate(activeWallEvents[0].eventDate)} • {activeWallEvents[0].venue}
              </span>
            </div>
          ) : activeWallEvents.length > 1 ? (
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setEventsDropdownOpen(true)}
              onMouseLeave={() => setEventsDropdownOpen(false)}
            >
              <button
                onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(99, 78, 226, 0.28)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#e0e7ff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.4">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Live Wall: {activeWallEvents.length} Events Selected</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Reveal popover card listing active events */}
              {eventsDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '320px',
                    backgroundColor: 'rgba(18, 16, 44, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#a78bfa',
                      marginBottom: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingBottom: '4px',
                    }}
                  >
                    Events Displayed on Live Wall
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeWallEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                          {ev.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                          {formatDisplayDate(ev.eventDate)} • {ev.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '11px',
                fontWeight: 800,
                color: '#f87171',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Wall Paused</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/"
            style={{
              padding: '6px 14px',
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Share Feedback</span>
          </Link>
          <Link
            to="/history"
            style={{
              padding: '6px 14px',
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
            title="Admin Moderation Portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-caption)',
              fontWeight: location.pathname.startsWith('/admin') ? 700 : 500,
              color: location.pathname.startsWith('/admin') ? 'var(--accent-orange)' : 'var(--text-secondary)',
              backgroundColor: location.pathname.startsWith('/admin') ? 'rgba(255, 107, 0, 0.1)' : 'transparent',
              border: location.pathname.startsWith('/admin') ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Admin</span>
          </Link>
        </nav>

        {/* Right Desktop: Average Rating + Submissions Counter + Status */}
        <div className="hidden-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Average Rating Pill with custom SVG star */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontSize: 'var(--text-caption)',
              fontWeight: 800,
            }}
            title="Average Visitor Star Rating across displayed wall events"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{averageRating ? averageRating.toFixed(1) : '5.0'}</span>
          </div>

          {/* Submissions Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Authoritative accepted submissions count from database"
          >
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              COUNT
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
                width: '7px',
                height: '7px',
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
        </div>

        {/* Right Mobile: Compact Count + Action Button + Menu Trigger */}
        <div className="visible-on-mobile-flex" style={{ alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
              color: '#f59e0b',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{averageRating ? averageRating.toFixed(1) : '5.0'}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--accent-yellow)',
            }}
          >
            <span>{totalSubmissions}</span>
          </div>

          <Link
            to="/submit"
            style={{
              height: '32px',
              padding: '0 12px',
              backgroundColor: 'var(--accent-orange)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Feedback</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: mobileMenuOpen ? 'var(--accent-orange)' : 'var(--bg-surface-elevated)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
          >
            {mobileMenuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Navigation Drawer with accessible SVG icons */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '56px',
            zIndex: 9999,
            backgroundColor: 'rgba(18, 22, 70, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', width: '100%', margin: '0 auto' }}>
            {/* Active Wall Event Banner in Mobile Menu */}
            {activeWallEvents.length > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#fed7aa', marginBottom: '4px' }}>
                  Live Wall Events ({activeWallEvents.length})
                </div>
                {activeWallEvents.map((ev) => (
                  <div key={ev.id} style={{ fontWeight: 700, marginTop: '2px' }}>
                    {ev.name} • {formatDisplayDate(ev.eventDate)} ({ev.venue})
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: location.pathname === '/' ? 'var(--accent-orange-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${location.pathname === '/' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-body)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span>Live 3D Feedback Wall</span>
            </Link>

            <Link
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-orange)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 'var(--text-body)',
                boxShadow: '0 4px 14px var(--accent-glow)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>+ Share Feedback & Rating</span>
            </Link>

            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: location.pathname === '/history' ? 'var(--accent-orange-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${location.pathname === '/history' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-body)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Feedback History</span>
            </Link>

            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 'var(--text-body)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Admin Moderation Portal</span>
            </Link>

            {/* Connection and sync stats in drawer */}
            <div
              style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--lh-normal)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>System Status</span>
                <span style={{ color: getStatusColor(), fontWeight: 800 }}>{effectiveStatus}</span>
              </div>
              <div>
                Authoritative Database: <strong>{totalSubmissions} accepted notes</strong> (Avg: {averageRating.toFixed(1)} / 5.0)
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
