import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.adminLogin({
        adminId: adminId.trim(),
        password,
      });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials provided.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="studio-wall-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px' }}>
      {/* Centered 3D Pegboard Container */}
      <div
        className="pegboard-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '40px 28px 36px 28px',
          position: 'relative',
        }}
      >
        {/* Top-Left Red-Orange Architect Lamp Accent casting warm cone */}
        <div
          style={{
            position: 'absolute',
            top: '-24px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#f04328',
              border: '2px solid #ffffff',
              boxShadow: '0 4px 14px rgba(240, 67, 40, 0.5), 0 0 20px rgba(255, 240, 216, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#fff5d6',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            Studio Keylight
          </span>
        </div>

        {/* Top-Right Terracotta Studio Clock Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#e05a2b',
            border: '2px solid #ffffff',
            borderRadius: 'var(--radius-full)',
            padding: '5px 14px',
            boxShadow: '0 6px 16px rgba(224, 90, 43, 0.5)',
            zIndex: 10,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
            {timeStr || 'STUDIO CLOCK'}
          </span>
        </div>

        {/* Pinned 3D Curled Coral-Orange Post-It Memo at top */}
        <div
          style={{
            backgroundColor: '#ff9e58',
            backgroundImage: 'linear-gradient(175deg, #ff9e58 0%, #f08035 100%)',
            color: '#181528',
            borderRadius: '2px 2px 12px 2px',
            borderTop: '2px solid rgba(255, 255, 255, 0.75)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.45)',
            padding: '16px 20px',
            transform: 'rotate(-2deg)',
            boxShadow: '0 12px 28px rgba(18, 14, 52, 0.45), 0 4px 10px rgba(0, 0, 0, 0.25)',
            marginBottom: '26px',
            marginTop: '12px',
            position: 'relative',
          }}
        >
          {/* Top Adhesive Strip Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.24)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#181528" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Staff & Moderator Access
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-note)',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#181528',
            }}
          >
            Authorized DevBappa Solutions Expo Personnel Only. Submissions, layout states, and audit trails are logged.
          </p>
        </div>

        {/* Error Banner Styled as a Pinned Coral-Red Mini Strip */}
        {error && (
          <div
            style={{
              backgroundColor: '#ff5d68',
              color: '#ffffff',
              borderRadius: '8px',
              borderTop: '2px solid rgba(255, 255, 255, 0.6)',
              borderBottom: '3px solid #b02532',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 18px rgba(176, 37, 50, 0.45)',
              transform: 'rotate(1deg)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700 }}>{error}</span>
          </div>
        )}

        {/* Main Login Form Pad */}
        <div className="studio-pad-card" style={{ padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '26px',
                fontWeight: 800,
                color: '#181528',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Control Studio Login
            </h1>
            <p style={{ fontSize: 'var(--text-body-sm)', color: '#565070', fontWeight: 500 }}>
              Enter administrative credentials to access moderation controls.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="admin-id"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#413a5e',
                  marginBottom: '6px',
                }}
              >
                Admin ID
              </label>
              <input
                id="admin-id"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. admin"
                required
                autoFocus
                className="studio-input-well"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#413a5e',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="studio-input-well"
              />
            </div>

            {/* Tactile 3D Terracotta-Orange Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-3d-studio btn-3d-orange"
              style={{
                width: '100%',
                height: '48px',
                fontSize: '16px',
                marginTop: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Control Studio'}</span>
            </button>
          </form>

          {/* Back link to live wall */}
          <div style={{ textAlign: 'center', marginTop: '22px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#634ee2',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Return to Public Live Wall</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
