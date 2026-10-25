import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-outer)',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          padding: '44px 32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-orange-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'var(--text-title-lg)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--lh-normal)',
            marginBottom: '28px',
          }}
        >
          The page you are looking for does not exist on the DevBappa Live Feedback Wall.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '46px',
            padding: '0 24px',
            backgroundColor: 'var(--accent-orange)',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: 'var(--text-body)',
            boxShadow: '0 4px 14px var(--accent-glow)',
            transition: 'opacity 0.2s',
          }}
        >
          Return to Wall
        </Link>
      </div>
    </div>
  );
};
