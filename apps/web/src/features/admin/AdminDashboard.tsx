import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminAnalytics,
  AdminFeedbackItem,
  AuditEventItem,
  Role,
} from '@devbappa/shared';
import { api } from '../../services/api.js';
import { Logo } from '../../components/brand/Logo.js';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & Admin Info
  const [adminId, setAdminId] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Tab & View State
  const [activeTab, setActiveTab] = useState<'feedback' | 'analytics' | 'audit'>('feedback');
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');

  // Analytics State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  // Feedback Management State
  const [feedbackItems, setFeedbackItems] = useState<AdminFeedbackItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'deleted'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Audit Log State
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Confirmation Modal State
  const [actionConfirm, setActionConfirm] = useState<{
    id: string;
    action: 'hide' | 'restore' | 'soft-delete' | 'recover';
    displayName: string;
    fullName: string;
  } | null>(null);

  // Studio Clock Live Time
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

  // Verify Admin Session on mount
  useEffect(() => {
    api
      .adminGetSession()
      .then((res) => {
        setAdminId(res.adminId);
        setIsAuthChecking(false);
      })
      .catch(() => {
        navigate('/admin');
      });
  }, [navigate]);

  // Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await api.adminGetAnalytics();
      setAnalytics(data);
    } catch {
      // Session might have expired
    }
  }, []);

  // Fetch Feedback Items
  const loadFeedback = useCallback(async () => {
    setIsLoadingFeedback(true);
    try {
      const data = await api.adminGetFeedback({
        search: search.trim() || undefined,
        role: selectedRole === 'All' ? undefined : selectedRole,
        status: statusFilter,
        page,
        limit: 12,
      });
      setFeedbackItems(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch {
      // Error loading feedback
    } finally {
      setIsLoadingFeedback(false);
    }
  }, [search, selectedRole, statusFilter, page]);

  // Fetch Audit Trail
  const loadAudit = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const data = await api.adminGetAudit({
        page: auditPage,
        limit: 20,
      });
      setAuditEvents(data.items);
      setAuditTotalPages(data.totalPages);
    } catch {
      // Error loading audit
    } finally {
      setIsLoadingAudit(false);
    }
  }, [auditPage]);

  // Load appropriate data when tab or filters change
  useEffect(() => {
    if (isAuthChecking) return;
    if (activeTab === 'feedback') {
      loadFeedback();
      loadAnalytics();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab, isAuthChecking, loadFeedback, loadAnalytics, loadAudit]);

  // Moderation Handlers
  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    const { id, action } = actionConfirm;

    try {
      if (action === 'hide') {
        await api.adminHideFeedback(id);
      } else if (action === 'restore') {
        await api.adminRestoreFeedback(id);
      } else if (action === 'soft-delete') {
        await api.adminSoftDeleteFeedback(id);
      } else if (action === 'recover') {
        await api.adminRecoverFeedback(id);
      }

      setActionConfirm(null);
      loadFeedback();
      loadAnalytics();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      navigate('/admin');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="studio-wall-backdrop" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pegboard-panel" style={{ padding: '32px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Authenticating Control Studio Session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-wall-backdrop" style={{ minHeight: '100%', paddingBottom: '60px' }}>
      {/* ============================================================== */}
      {/* 4.1 TOP FLOATING VIOLET SHELF HEADER                           */}
      {/* ============================================================== */}
      <header
        className="studio-shelf-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: DevBappa Logo + Control Studio Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo height={34} />
          <div
            style={{
              height: '24px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(20, 16, 56, 0.45)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fff0d4',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff0d4" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Pegboard Control Studio</span>
          </div>
        </div>

        {/* Center: Live Studio Clock & Sync Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#e05a2b',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 14px',
            boxShadow: '0 4px 12px rgba(224, 90, 43, 0.45)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em' }}>
            {timeStr || 'LIVE TIME'}
          </span>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>
            OPERATOR: {adminId.toUpperCase()}
          </span>
        </div>

        {/* Right: Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" className="btn-3d-studio btn-3d-mint" style={{ padding: '8px 14px', fontSize: '12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>View 3D Wall (/)</span>
          </Link>

          <button
            onClick={() => {
              loadFeedback();
              loadAnalytics();
            }}
            className="btn-3d-studio btn-3d-periwinkle"
            style={{ padding: '8px 14px', fontSize: '12px' }}
            title="Refresh DB Data"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="btn-3d-studio btn-3d-coral"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(20, 16, 56, 0.45)',
            padding: '6px',
            borderRadius: '14px',
            width: 'fit-content',
            border: '1px solid rgba(255, 255, 255, 0.14)',
          }}
        >
          <button
            onClick={() => setActiveTab('feedback')}
            className={`btn-3d-studio ${activeTab === 'feedback' ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Moderation Board ({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn-3d-studio ${activeTab === 'analytics' ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Studio Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`btn-3d-studio ${activeTab === 'audit' ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Immutable Audit Trail</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 4.2 SUMMARY KPI METRICS: 3D CURLED POST-IT & CLAY BLOCKS       */}
        {/* ============================================================== */}
        {analytics && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9e58' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff5d6' }}>
                  Authoritative Expo Database Metrics
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>
                Includes Visible, Hidden & Moderated Records
              </span>
            </div>

            {/* 6 Curled Post-it KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Total Accepted Submissions (Butter Yellow) */}
              <div
                style={{
                  backgroundColor: '#ffe66d',
                  backgroundImage: 'linear-gradient(175deg, #ffe66d 0%, #f2cc39 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(-1.2deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#453b66' }}>
                  Total Accepted
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {analytics.totalAccepted}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#453b66' }}>
                  Visible + Hidden Records
                </div>
              </div>

              {/* Currently Visible on Wall (Mint) */}
              <div
                style={{
                  backgroundColor: '#a6f7d1',
                  backgroundImage: 'linear-gradient(175deg, #a6f7d1 0%, #62d6a2 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(1deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a4f36' }}>
                  Live on 3D Wall
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {analytics.totalVisible}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a4f36' }}>
                  Active Public Display
                </div>
              </div>

              {/* Student Submissions (Sky Ice Blue) */}
              <div
                style={{
                  backgroundColor: '#8ce0ff',
                  backgroundImage: 'linear-gradient(175deg, #8ce0ff 0%, #65c5f0 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(-0.8deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1b4d68' }}>
                  Students
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {analytics.roleBreakdown.Student || 0}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1b4d68' }}>
                  Student Impressions
                </div>
              </div>

              {/* Faculty Submissions (Soft Lavender) */}
              <div
                style={{
                  backgroundColor: '#b695ff',
                  backgroundImage: 'linear-gradient(175deg, #b695ff 0%, #9a73f5 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(1.2deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#38226b' }}>
                  Faculty
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {analytics.roleBreakdown.Faculty || 0}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#38226b' }}>
                  Academic Feedback
                </div>
              </div>

              {/* Other Visitors (Tangerine Peach) */}
              <div
                style={{
                  backgroundColor: '#ff9e58',
                  backgroundImage: 'linear-gradient(175deg, #ff9e58 0%, #f08035 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(-1.5deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#54280f' }}>
                  Other Visitors
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {analytics.roleBreakdown['Other Visitor'] || 0}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#54280f' }}>
                  Guest Impressions
                </div>
              </div>

              {/* Hidden & Soft-Deleted (Coral Red) */}
              <div
                style={{
                  backgroundColor: '#ff5d68',
                  backgroundImage: 'linear-gradient(175deg, #ff5d68 0%, #f04352 100%)',
                  color: '#ffffff',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(0.9deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#fff0d4' }}>
                  Moderated
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#ffffff' }}>
                  {analytics.totalHidden + analytics.totalDeleted}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff0d4' }}>
                  {analytics.totalHidden} Hidden | {analytics.totalDeleted} Deleted
                </div>
              </div>
            </div>

            {/* Department Breakdown Bar with 3D Rounded Cylindrical Progress Meters */}
            {activeTab === 'analytics' && Object.keys(analytics.departmentBreakdown).length > 0 && (
              <div style={{ marginTop: '24px', backgroundColor: 'rgba(20, 16, 56, 0.45)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff5d6', marginBottom: '14px' }}>
                  Department Submissions Meter
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics.departmentBreakdown).map(([dept, count]) => {
                    const pct = Math.round((count / (analytics.totalAccepted || 1)) * 100);
                    return (
                      <div key={dept}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#f8fafc' }}>
                          <span>{dept}</span>
                          <span style={{ color: '#ffd166' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: '10px', backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: '#f04328',
                              backgroundImage: 'linear-gradient(90deg, #f04328 0%, #ff9e58 100%)',
                              borderRadius: 'var(--radius-full)',
                              boxShadow: '0 2px 6px rgba(240, 67, 40, 0.5)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 4.3 FEEDBACK MODERATION BOARD (Dual View: Cards & Ledger)      */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            {/* Filter & Search Shelf Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                backgroundColor: 'rgba(20, 16, 56, 0.55)',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '24px',
              }}
            >
              {/* Search input */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search visitor, role, or message..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="studio-input-well"
                  style={{ paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8b85a8"
                  strokeWidth="2.5"
                  style={{ position: 'absolute', left: '12px', top: '13px' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Role filter pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['All', 'Student', 'Faculty', 'Other Visitor'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRole(r);
                      setPage(1);
                    }}
                    className={`btn-3d-studio ${selectedRole === r ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                    style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase' }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Status filter pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['all', 'visible', 'hidden', 'deleted'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className={`btn-3d-studio ${statusFilter === s ? 'btn-3d-periwinkle' : 'btn-3d-ghost'}`}
                    style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* View Switcher: Pegboard Cards vs Ledger Table */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '3px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <button
                  onClick={() => setViewMode('cards')}
                  title="Pegboard Cards View"
                  style={{
                    backgroundColor: viewMode === 'cards' ? '#6e54e8' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => setViewMode('ledger')}
                  title="Compact Ledger View"
                  style={{
                    backgroundColor: viewMode === 'ledger' ? '#6e54e8' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>Ledger</span>
                </button>
              </div>
            </div>

            {/* Content Display: Cards vs Ledger */}
            {isLoadingFeedback ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#fff0d4', fontWeight: 700 }}>
                Loading feedback records from database...
              </div>
            ) : feedbackItems.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.75)' }}>
                No feedback records found matching active filters.
              </div>
            ) : viewMode === 'cards' ? (
              /* DUAL VIEW 1: PEGBOARD CARDS VIEW */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                {feedbackItems.map((item, idx) => {
                  const isVisible = item.visibilityStatus === 'visible' && !item.deletedAt;
                  const isDeleted = !!item.deletedAt;
                  const rotationDeg = idx % 2 === 0 ? -1.2 : 1.2;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 14px 28px rgba(14, 16, 56, 0.5)',
                        transform: `rotate(${rotationDeg}deg)`,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Top Curled Sticky Note Area */}
                      <div
                        className={`sticky-note note-${item.colorVariant || 'yellow'}`}
                        style={{
                          padding: '18px 18px 14px 18px',
                          borderTopLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                          minHeight: '190px',
                          position: 'relative',
                        }}
                      >
                        {/* Top adhesive strip */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '18px',
                            backgroundColor: 'rgba(255, 255, 255, 0.22)',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                          }}
                        />

                        {/* Note Header: Public Name + Role Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-brand)', fontSize: '18px', fontWeight: 800, color: 'var(--note-ink-primary)' }}>
                            {item.publicDisplayName}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(26, 22, 43, 0.1)',
                              color: 'var(--note-ink-primary)',
                            }}
                          >
                            {item.role}
                          </span>
                        </div>

                        {/* Note Body Text in handwriting */}
                        <p
                          style={{
                            fontFamily: 'var(--font-note)',
                            fontSize: '20px',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: 'var(--note-ink-primary)',
                            flex: 1,
                            margin: '8px 0',
                          }}
                        >
                          "{item.message}"
                        </p>

                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--note-ink-meta)', marginTop: '8px' }}>
                          {item.department || item.institutionName || 'Expo Visitor'}
                        </div>
                      </div>

                      {/* Admin Confidential Footer Strip (#1E1B4B) with private full_name */}
                      <div
                        style={{
                          backgroundColor: '#1e1b4b',
                          color: '#f8fafc',
                          padding: '14px 16px',
                          borderTop: '2px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        {/* Full Name Badge (strictly private) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#ea580c', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', textTransform: 'uppercase' }}>
                              PRIVATE
                            </span>
                            <strong style={{ fontSize: '13px', color: '#ffffff' }}>{item.fullName}</strong>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isDeleted ? '#ef4444' : isVisible ? '#10b981' : '#f59e0b',
                              color: '#ffffff',
                            }}
                          >
                            {isDeleted ? 'SOFT-DELETED' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                          </span>
                        </div>

                        {item.designation && (
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            Designation: <strong>{item.designation}</strong>
                          </div>
                        )}

                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>

                        {/* Tactile 3D Moderation Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          {!isDeleted ? (
                            <>
                              {isVisible ? (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'hide',
                                      displayName: item.publicDisplayName,
                                      fullName: item.fullName,
                                    })
                                  }
                                  className="btn-3d-studio btn-3d-orange"
                                  style={{ flex: 1, padding: '7px 10px', fontSize: '11px' }}
                                >
                                  Hide
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'restore',
                                      displayName: item.publicDisplayName,
                                      fullName: item.fullName,
                                    })
                                  }
                                  className="btn-3d-studio btn-3d-mint"
                                  style={{ flex: 1, padding: '7px 10px', fontSize: '11px' }}
                                >
                                  Restore
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  setActionConfirm({
                                    id: item.id,
                                    action: 'soft-delete',
                                    displayName: item.publicDisplayName,
                                    fullName: item.fullName,
                                  })
                                }
                                className="btn-3d-studio btn-3d-coral"
                                style={{ flex: 1, padding: '7px 10px', fontSize: '11px' }}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                setActionConfirm({
                                  id: item.id,
                                  action: 'recover',
                                  displayName: item.publicDisplayName,
                                  fullName: item.fullName,
                                })
                              }
                              className="btn-3d-studio btn-3d-periwinkle"
                              style={{ width: '100%', padding: '7px 10px', fontSize: '11px' }}
                            >
                              Recover Record
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DUAL VIEW 2: COMPACT LEDGER VIEW */
              <div style={{ overflowX: 'auto', backgroundColor: '#f7f6ff', borderRadius: '12px', border: '2px solid #ffffff', boxShadow: '0 8px 24px rgba(12, 16, 68, 0.45)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', color: '#181528' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#eae8f8', borderBottom: '2px solid #c5c0e8' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Visitor</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Role & Dept</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Message</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackItems.map((item, i) => {
                      const isVisible = item.visibilityStatus === 'visible' && !item.deletedAt;
                      const isDeleted = !!item.deletedAt;
                      return (
                        <tr
                          key={item.id}
                          style={{
                            backgroundColor: i % 2 === 0 ? '#ffffff' : '#f7f6ff',
                            borderBottom: '1px solid #e2def5',
                          }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#181528' }}>{item.publicDisplayName}</div>
                            <div style={{ fontSize: '11px', color: '#634ee2', fontWeight: 600 }}>{item.fullName}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontWeight: 700 }}>{item.role}</span>
                            <div style={{ fontSize: '11px', color: '#565070' }}>{item.department || item.institutionName}</div>
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '300px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                              "{item.message}"
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isDeleted ? '#ef4444' : isVisible ? '#10b981' : '#f59e0b',
                                color: '#ffffff',
                              }}
                            >
                              {isDeleted ? 'DELETED' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#565070', whiteSpace: 'nowrap' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {!isDeleted ? (
                                <>
                                  {isVisible ? (
                                    <button
                                      onClick={() =>
                                        setActionConfirm({
                                          id: item.id,
                                          action: 'hide',
                                          displayName: item.publicDisplayName,
                                          fullName: item.fullName,
                                        })
                                      }
                                      className="btn-3d-studio btn-3d-orange"
                                      style={{ padding: '4px 8px', fontSize: '10px' }}
                                    >
                                      Hide
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setActionConfirm({
                                          id: item.id,
                                          action: 'restore',
                                          displayName: item.publicDisplayName,
                                          fullName: item.fullName,
                                        })
                                      }
                                      className="btn-3d-studio btn-3d-mint"
                                      style={{ padding: '4px 8px', fontSize: '10px' }}
                                    >
                                      Restore
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      setActionConfirm({
                                        id: item.id,
                                        action: 'soft-delete',
                                        displayName: item.publicDisplayName,
                                        fullName: item.fullName,
                                      })
                                    }
                                    className="btn-3d-studio btn-3d-coral"
                                    style={{ padding: '4px 8px', fontSize: '10px' }}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'recover',
                                      displayName: item.publicDisplayName,
                                      fullName: item.fullName,
                                    })
                                  }
                                  className="btn-3d-studio btn-3d-periwinkle"
                                  style={{ padding: '4px 8px', fontSize: '10px' }}
                                >
                                  Recover
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-3d-studio btn-3d-ghost"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff5d6' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-3d-studio btn-3d-ghost"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 4.4 IMMUTABLE 3D AUDIT TRAIL LOG                               */}
        {/* ============================================================== */}
        {activeTab === 'audit' && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4cd995' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff5d6' }}>
                  Server-Managed Immutable Audit Trail
                </h2>
              </div>
              <button
                onClick={loadAudit}
                className="btn-3d-studio btn-3d-ghost"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                Refresh Log
              </button>
            </div>

            {isLoadingAudit ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#fff5d6' }}>
                Loading audit events...
              </div>
            ) : auditEvents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                No moderation audit events recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auditEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      backgroundColor: 'rgba(20, 16, 56, 0.55)',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            evt.action === 'hide'
                              ? '#f04328'
                              : evt.action === 'restore'
                              ? '#4cd995'
                              : evt.action === 'soft-delete'
                              ? '#ff5d68'
                              : '#7c68ff',
                          color: '#ffffff',
                        }}
                      >
                        {evt.action.toUpperCase()}
                      </span>
                      <span>
                        Operator: <strong style={{ color: '#ffd166' }}>{evt.adminId}</strong>
                      </span>
                      <span style={{ color: '#cbd5e1' }}>Feedback ID: {evt.feedbackId.slice(0, 8)}...</span>
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}

                {/* Audit Pagination */}
                {auditTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => p - 1)}
                      className="btn-3d-studio btn-3d-ghost"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff5d6', alignSelf: 'center' }}>
                      Page {auditPage} of {auditTotalPages}
                    </span>
                    <button
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => setAuditPage((p) => p + 1)}
                      className="btn-3d-studio btn-3d-ghost"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Confirmation Modal Styled as 3D Pinned Studio Dialog */}
      {actionConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(12, 16, 60, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="studio-pad-card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '28px 24px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Top red-orange accent pin */}
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#f04328',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
                margin: '0 auto 14px auto',
              }}
            />

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#181528', marginBottom: '8px' }}>
              Confirm Moderation Action
            </h3>

            <p style={{ fontSize: '13px', color: '#565070', lineHeight: 1.4, marginBottom: '20px' }}>
              Are you sure you want to <strong>{actionConfirm.action.toUpperCase()}</strong> the feedback submitted by{' '}
              <strong>{actionConfirm.displayName}</strong> ({actionConfirm.fullName})?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setActionConfirm(null)}
                className="btn-3d-studio btn-3d-ghost"
                style={{ flex: 1, backgroundColor: '#eae8f8', color: '#181528', borderBottomColor: '#c5c0e8' }}
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteAction}
                className={`btn-3d-studio ${
                  actionConfirm.action === 'hide' || actionConfirm.action === 'soft-delete'
                    ? 'btn-3d-coral'
                    : 'btn-3d-mint'
                }`}
                style={{ flex: 1 }}
              >
                Confirm {actionConfirm.action.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
