import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
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
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          padding: '40px 32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
        <h1
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '24px',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '8px',
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}
        >
          The page you are looking for does not exist on the DevBappa Live Feedback Wall.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: 'var(--accent-orange)',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px var(--accent-glow)',
          }}
        >
          Return to Wall
        </Link>
      </div>
    </div>
  );
};
