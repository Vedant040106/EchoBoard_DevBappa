import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminAnalytics,
  AdminFeedbackItem,
  AdminEventItem,
  AuditEventItem,
  Role,
} from '@devbappa/shared';
import { api } from '../../services/api.js';
import { Logo } from '../../components/brand/Logo.js';

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SvgStar: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#f59e0b' : 'none'}
    stroke={filled ? '#d97706' : 'rgba(20, 22, 31, 0.35)'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & Admin Info
  const [adminId, setAdminId] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Tab & View State
  const [activeTab, setActiveTab] = useState<'feedback' | 'events' | 'analytics' | 'audit'>('feedback');
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');

  // Analytics State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  // Events Management State
  const [eventsList, setEventsList] = useState<AdminEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [wallSelection, setWallSelection] = useState<string[]>([]);
  const [isSavingWallSelection, setIsSavingWallSelection] = useState(false);
  const [wallSelectionSuccess, setWallSelectionSuccess] = useState(false);

  // Create Event Form State
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-10-23');
  const [newEventVenue, setNewEventVenue] = useState('VPPCOE&VA, Sion');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newShowOnWall, setNewShowOnWall] = useState(true);
  const [newAcceptSubmissions, setNewAcceptSubmissions] = useState(true);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);
  const [eventFormSuccess, setEventFormSuccess] = useState(false);

  // Feedback Management State
  const [feedbackItems, setFeedbackItems] = useState<AdminFeedbackItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'deleted'>('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('');
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

  // Fetch Events
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await api.adminGetEvents();
      setEventsList(data);
      const activeOnWall = data.filter((e) => e.isDisplayedOnWall).map((e) => e.id);
      setWallSelection(activeOnWall);
    } catch {
      // Failed loading events
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

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
        eventId: selectedEventFilter || undefined,
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
  }, [search, selectedRole, statusFilter, selectedEventFilter, page]);

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
    loadEvents();
    if (activeTab === 'feedback') {
      loadFeedback();
      loadAnalytics();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab, isAuthChecking, loadFeedback, loadAnalytics, loadAudit, loadEvents]);

  // Wall Selection Checkbox Toggle Handler
  const handleToggleWallCheckbox = (eventId: string) => {
    setWallSelection((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Apply Wall Selection to Backend
  const handleApplyWallSelection = async () => {
    setIsSavingWallSelection(true);
    try {
      await api.adminSetWallSelection(wallSelection);
      setWallSelectionSuccess(true);
      setTimeout(() => setWallSelectionSuccess(false), 3000);
      await loadEvents();
      await loadAnalytics();
    } catch (err: any) {
      alert(err.message || 'Failed to update live wall selection');
    } finally {
      setIsSavingWallSelection(false);
    }
  };

  // Toggle Acceptance of Submissions for an Event
  const handleToggleAcceptingSubmissions = async (eventItem: AdminEventItem) => {
    try {
      await api.adminUpdateEvent(eventItem.id, {
        isAcceptingFeedback: !eventItem.isAcceptingFeedback,
      });
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to update event submission status');
    }
  };

  // Create New Event Handler
  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventFormError(null);

    if (!newEventName.trim()) {
      setEventFormError('Event Name is required.');
      return;
    }
    if (!newEventDate.trim()) {
      setEventFormError('Event Date is required.');
      return;
    }
    if (!newEventVenue.trim()) {
      setEventFormError('Venue is required.');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      await api.adminCreateEvent({
        name: newEventName.trim(),
        eventDate: newEventDate.trim(),
        venue: newEventVenue.trim(),
        description: newEventDescription.trim() || undefined,
        isDisplayedOnWall: newShowOnWall,
        isAcceptingFeedback: newAcceptSubmissions,
      });

      setEventFormSuccess(true);
      setNewEventName('');
      setNewEventDescription('');
      setTimeout(() => {
        setEventFormSuccess(false);
        setIsEventDrawerOpen(false);
      }, 1500);

      await loadEvents();
      await loadAnalytics();
    } catch (err: any) {
      setEventFormError(err.message || 'Failed to create event');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Moderation Handlers
  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    try {
      if (actionConfirm.action === 'hide') {
        await api.adminHideFeedback(actionConfirm.id);
      } else if (actionConfirm.action === 'restore') {
        await api.adminRestoreFeedback(actionConfirm.id);
      } else if (actionConfirm.action === 'soft-delete') {
        await api.adminSoftDeleteFeedback(actionConfirm.id);
      } else if (actionConfirm.action === 'recover') {
        await api.adminRestoreFeedback(actionConfirm.id);
      }
      setActionConfirm(null);
      await loadFeedback();
      await loadAnalytics();
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f111c', color: '#fed7aa', fontWeight: 800 }}>
        Authenticating Operator Studio...
      </div>
    );
  }

  return (
    <div
      className="studio-wall-backdrop"
      style={{
        minHeight: '100vh',
        color: '#f8fafc',
        paddingBottom: '80px',
      }}
    >
      {/* 4.1 TOP STUDIO LEDGE & OPERATOR CLOCK BAR */}
      <header
        className="studio-shelf-header"
        style={{
          height: '64px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid rgba(255, 255, 255, 0.18)',
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
            <span>Multi-Event Pegboard Studio</span>
          </div>
        </div>

        {/* Center: Live Studio Clock & Operator Pill */}
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
            <span>View Live Wall (/)</span>
          </Link>

          <button
            onClick={() => {
              loadFeedback();
              loadAnalytics();
              loadEvents();
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
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
            flexWrap: 'wrap',
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
            onClick={() => setActiveTab('events')}
            className={`btn-3d-studio ${activeTab === 'events' ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Events & Wall Broadcast ({eventsList.length})</span>
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

        {/* 4.2 SUMMARY KPI METRICS: 3D CURLED POST-IT & CLAY BLOCKS */}
        {analytics && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9e58' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff5d6' }}>
                  Authoritative Platform Database Metrics
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>
                Aggregated Across All Events & Broadcasts
              </span>
            </div>

            {/* Curled Post-it KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Overall Average Rating (Gold Star Post-it) */}
              <div
                style={{
                  backgroundColor: '#fef08a',
                  backgroundImage: 'linear-gradient(175deg, #fef08a 0%, #facc15 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(-1.4deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#713f12' }}>
                  Average Rating
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                  <span style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, color: '#181528' }}>
                    {analytics.averageRating !== undefined ? Number(analytics.averageRating).toFixed(1) : '5.0'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#713f12' }}>/ 5.0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <SvgStar key={s} filled={s <= Math.round(analytics.averageRating || 5)} size={14} />
                  ))}
                </div>
              </div>

              {/* Total Accepted Submissions (Butter Yellow) */}
              <div
                style={{
                  backgroundColor: '#ffe66d',
                  backgroundImage: 'linear-gradient(175deg, #ffe66d 0%, #f2cc39 100%)',
                  color: '#181528',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(0.8deg)',
                  boxShadow: '0 8px 20px rgba(16, 12, 48, 0.4)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.22)' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#453b66' }}>
                  Total Submissions
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
                  transform: 'rotate(-0.9deg)',
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

              {/* Active Events Broadcasting */}
              <div
                style={{
                  backgroundColor: '#c4b5fd',
                  backgroundImage: 'linear-gradient(175deg, #c4b5fd 0%, #a78bfa 100%)',
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
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#312e81' }}>
                  Wall Broadcasts
                </div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', fontWeight: 800, margin: '4px 0', color: '#181528' }}>
                  {eventsList.filter((e) => e.isDisplayedOnWall).length}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#312e81' }}>
                  of {eventsList.length} Total Events
                </div>
              </div>

              {/* Moderated Count (Coral Red) */}
              <div
                style={{
                  backgroundColor: '#ff5d68',
                  backgroundImage: 'linear-gradient(175deg, #ff5d68 0%, #f04352 100%)',
                  color: '#ffffff',
                  padding: '16px 14px',
                  borderRadius: '2px 2px 10px 2px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  transform: 'rotate(-0.8deg)',
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
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 1: EVENTS & LIVE WALL BROADCAST STUDIO                     */}
        {/* ============================================================== */}
        {activeTab === 'events' && (
          <section className="pegboard-panel" style={{ padding: '28px 24px' }}>
            {/* Header & Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '4px' }}>
                  Multi-Event Wall Broadcast & Feedback Manager
                </h2>
                <p style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Select one or multiple events to broadcast in real time to the public 3D pegboard wall, and control which events accept visitor submissions.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsEventDrawerOpen(!isEventDrawerOpen)}
                  className="btn-3d-studio btn-3d-orange"
                  style={{ height: '42px', padding: '0 18px', fontSize: '13px' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>{isEventDrawerOpen ? 'Close Form' : 'Create New Event'}</span>
                </button>

                <button
                  onClick={handleApplyWallSelection}
                  disabled={isSavingWallSelection}
                  className="btn-3d-studio btn-3d-mint"
                  style={{ height: '42px', padding: '0 20px', fontSize: '13px' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isSavingWallSelection ? 'Broadcasting...' : `Apply Wall Selection (${wallSelection.length})`}</span>
                </button>
              </div>
            </div>

            {/* Success Toast for Wall Selection */}
            {wallSelectionSuccess && (
              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1.5px solid #10b981',
                  borderRadius: '10px',
                  color: '#6ee7b7',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Live wall broadcast updated! Realtime socket signals sent to all active screens.</span>
              </div>
            )}

            {/* Create New Event Drawer/Form */}
            {isEventDrawerOpen && (
              <div
                className="studio-pad-card"
                style={{
                  padding: '24px',
                  marginBottom: '28px',
                  border: '2px solid rgba(240, 67, 40, 0.4)',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181528', marginBottom: '4px' }}>
                  Create New DevBappa Event
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                  Configure event details, date, venue, and broadcast toggles for the 3D pegboard platform.
                </p>

                {eventFormError && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
                    {eventFormError}
                  </div>
                )}

                {eventFormSuccess && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
                    Event created successfully! Added to events ledger.
                  </div>
                )}

                <form onSubmit={handleCreateNewEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Event Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#181528', marginBottom: '4px' }}>
                      Event Name <span style={{ color: '#f04328' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="e.g. AI Symposium 2026"
                      required
                      className="studio-input-well"
                    />
                  </div>

                  {/* Event Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#181528', marginBottom: '4px' }}>
                      Event Date <span style={{ color: '#f04328' }}>*</span> (Formatted: {formatDisplayDate(newEventDate)})
                    </label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      required
                      className="studio-input-well"
                    />
                  </div>

                  {/* Venue */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#181528', marginBottom: '4px' }}>
                      Venue <span style={{ color: '#f04328' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newEventVenue}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      placeholder="e.g. VPPCOE&VA, Sion"
                      required
                      className="studio-input-well"
                    />
                  </div>

                  {/* Description */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#181528', marginBottom: '4px' }}>
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="e.g. Live Feedback & Showcase at College Auditorium"
                      className="studio-input-well"
                    />
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', gridColumn: '1 / -1', flexWrap: 'wrap', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#181528' }}>
                      <input
                        type="checkbox"
                        checked={newShowOnWall}
                        onChange={(e) => setNewShowOnWall(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#f04328' }}
                      />
                      Show on Public Wall (/)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#181528' }}>
                      <input
                        type="checkbox"
                        checked={newAcceptSubmissions}
                        onChange={(e) => setNewAcceptSubmissions(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      Accept New Submissions (/submit)
                    </label>
                  </div>

                  {/* Form Submit Button */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingEvent}
                      className="btn-3d-studio btn-3d-orange"
                      style={{ height: '44px', padding: '0 24px', fontSize: '13px' }}
                    >
                      {isSubmittingEvent ? 'Creating Event...' : '+ Add Event to System'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pinned 3D Event Studio Cards Grid */}
            {isLoadingEvents ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#fff0d4', fontWeight: 700 }}>
                Loading event configurations...
              </div>
            ) : eventsList.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.75)' }}>
                No events found in database.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '24px',
                }}
              >
                {eventsList.map((evt, idx) => {
                  const isOnWall = wallSelection.includes(evt.id);
                  const isAccepting = evt.isAcceptingFeedback;
                  const avgRating = evt.averageRating !== undefined ? Number(evt.averageRating).toFixed(1) : '5.0';
                  const rotationDeg = idx % 2 === 0 ? -1.0 : 1.0;

                  return (
                    <div
                      key={evt.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        padding: '24px',
                        boxShadow: isOnWall
                          ? '0 16px 36px rgba(16, 185, 129, 0.25), 0 8px 24px rgba(0, 0, 0, 0.4)'
                          : '0 12px 28px rgba(10, 12, 40, 0.45)',
                        border: isOnWall ? '2.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                        transform: `rotate(${rotationDeg}deg)`,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '280px',
                        position: 'relative',
                        color: '#181528',
                      }}
                    >
                      {/* Pushpin at top */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: isOnWall
                            ? 'radial-gradient(circle at 35% 35%, #a7f3d0 0%, #10b981 65%, #064e3b 100%)'
                            : 'radial-gradient(circle at 35% 35%, #fed7aa 0%, #f04328 65%, #7f1d1d 100%)',
                          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(0, 0, 0, 0.3)',
                        }}
                      />

                      <div>
                        {/* Event Name & Slug */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 800, color: '#181528', letterSpacing: '-0.01em', marginBottom: '2px' }}>
                              {evt.name}
                            </h3>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              /{evt.slug}
                            </span>
                          </div>

                          {/* Live Status Badge */}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isOnWall ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                              color: isOnWall ? '#065f46' : '#64748b',
                              border: isOnWall ? '1px solid #10b981' : '1px solid #cbd5e1',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isOnWall ? 'Broadcasting on Wall' : 'Off Wall'}
                          </span>
                        </div>

                        {/* Event Date & Venue */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569', fontWeight: 700, margin: '10px 0 16px 0' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f04328" strokeWidth="2.2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Date: {formatDisplayDate(evt.eventDate)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#634ee2" strokeWidth="2.2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            Venue: {evt.venue}
                          </span>
                        </div>

                        {/* Aggregated Stats: Submissions & Average Rating */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '10px',
                            backgroundColor: '#f8fafc',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '18px',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                              Submissions
                            </span>
                            <div style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 800, color: '#181528' }}>
                              {evt.totalSubmissions || 0}
                            </div>
                            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                              {evt.visibleCount || 0} visible
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                              Avg Star Rating
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 800, color: '#181528' }}>
                                {avgRating}
                              </span>
                              <SvgStar filled size={16} />
                            </div>
                            <div style={{ display: 'flex', gap: '1px' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <SvgStar key={s} filled={s <= Math.round(Number(avgRating))} size={11} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls Bar: On Live Wall & Accepting Submissions */}
                      <div
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        {/* Control 1: On Live Wall Multi-Select */}
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: isOnWall ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9',
                            border: isOnWall ? '1px solid #10b981' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: isOnWall ? '#065f46' : '#334155',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            On Live Pegboard Wall
                          </span>
                          <input
                            type="checkbox"
                            checked={isOnWall}
                            onChange={() => handleToggleWallCheckbox(evt.id)}
                            style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                          />
                        </label>

                        {/* Control 2: Accepting Submissions Toggle */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: isAccepting ? 'rgba(59, 130, 246, 0.08)' : '#f1f5f9',
                            border: isAccepting ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: isAccepting ? '#1d4ed8' : '#64748b',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Accepting Submissions
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAcceptingSubmissions(evt)}
                            className={`btn-3d-studio ${isAccepting ? 'btn-3d-mint' : 'btn-3d-ghost'}`}
                            style={{
                              padding: '3px 10px',
                              fontSize: '11px',
                              height: '28px',
                              backgroundColor: isAccepting ? undefined : '#e2e8f0',
                              color: isAccepting ? undefined : '#475569',
                            }}
                          >
                            {isAccepting ? 'Active' : 'Paused'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: FEEDBACK MODERATION BOARD (Dual View: Cards & Ledger)   */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            {/* Filter & Search Shelf Bar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                backgroundColor: 'rgba(20, 16, 56, 0.55)',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '24px',
              }}
            >
              {/* Top Row: Search Box & Event Filter Dropdown */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                {/* Search input */}
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
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

                {/* Event Filter Selector */}
                {eventsList.length > 0 && (
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label
                      htmlFor="admin-feedback-event-filter"
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#fed7aa',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Filter Event:
                    </label>
                    <select
                      id="admin-feedback-event-filter"
                      value={selectedEventFilter}
                      onChange={(e) => {
                        setSelectedEventFilter(e.target.value);
                        setPage(1);
                      }}
                      className="studio-input-well"
                      style={{
                        height: '42px',
                        minWidth: '240px',
                        backgroundColor: 'rgba(15, 17, 28, 0.95)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      <option value="">All Events ({eventsList.length})</option>
                      {eventsList.map((evt) => (
                        <option key={evt.id} value={evt.id} style={{ backgroundColor: '#181528', color: '#ffffff' }}>
                          {evt.name} — {formatDisplayDate(evt.eventDate)} {evt.isDisplayedOnWall ? '(On Wall)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Bottom Row: Role Filter, Status Filter & Dual View Switcher */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Role filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1' }}>Role:</span>
                  {(['All', 'Student', 'Faculty', 'Other Visitor'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRole(r);
                        setPage(1);
                      }}
                      className={`btn-3d-studio ${selectedRole === r ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                      style={{ padding: '5px 10px', fontSize: '11px', textTransform: 'uppercase' }}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Status filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1' }}>Status:</span>
                  {(['all', 'visible', 'hidden', 'deleted'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                      }}
                      className={`btn-3d-studio ${statusFilter === s ? 'btn-3d-periwinkle' : 'btn-3d-ghost'}`}
                      style={{ padding: '5px 10px', fontSize: '11px', textTransform: 'uppercase' }}
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
                  const itemRating = item.rating || 5;

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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

                        {/* 1 to 5 Star Rating Display */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <SvgStar key={s} filled={s <= itemRating} size={14} />
                          ))}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--note-ink-secondary)', marginLeft: '4px' }}>
                            {itemRating} / 5
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

                      {/* Admin Confidential Footer Strip (#1E1B4B) with private full_name and Event info */}
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
                        {/* Event Name & Venue Badge */}
                        {item.event && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(99, 78, 226, 0.25)',
                              border: '1px solid rgba(99, 78, 226, 0.45)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#c4b5fd',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{item.event.name} • {item.event.venue}</span>
                          </div>
                        )}

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
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Event</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Rating</th>
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
                      const itemRating = item.rating || 5;

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
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{item.event?.name || 'Tech Expo'}</span>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{item.event?.venue}</div>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontWeight: 800, marginRight: '4px' }}>{itemRating}</span>
                              <SvgStar filled size={13} />
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontWeight: 700 }}>{item.role}</span>
                            <div style={{ fontSize: '11px', color: '#565070' }}>{item.department || item.institutionName}</div>
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
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
        {/* TAB 3: STUDIO ANALYTICS (Ratings & Multi-Event Breakdown)     */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && analytics && (
          <section className="pegboard-panel" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6e54e8' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff5d6' }}>
                Multi-Event Ratings & Distribution Analytics
              </h2>
            </div>

            {/* Per-Event Performance Breakdown Table */}
            {analytics.eventsAnalytics && analytics.eventsAnalytics.length > 0 && (
              <div style={{ backgroundColor: 'rgba(20, 16, 56, 0.45)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fed7aa', marginBottom: '14px' }}>
                  Per-Event Ratings & Engagement Matrix
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', color: '#ffffff' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#fed7aa' }}>
                        <th style={{ padding: '10px 12px' }}>Event Name</th>
                        <th style={{ padding: '10px 12px' }}>Date & Venue</th>
                        <th style={{ padding: '10px 12px' }}>Live Wall</th>
                        <th style={{ padding: '10px 12px' }}>Submissions Open</th>
                        <th style={{ padding: '10px 12px' }}>Total Notes</th>
                        <th style={{ padding: '10px 12px' }}>Average Star Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.eventsAnalytics.map((evt) => {
                        const matchedEvent = eventsList.find((e) => e.id === evt.eventId);
                        return (
                          <tr key={evt.eventId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <td style={{ padding: '12px', fontWeight: 800 }}>{evt.name}</td>
                            <td style={{ padding: '12px', color: '#cbd5e1' }}>
                              {matchedEvent ? `${formatDisplayDate(matchedEvent.eventDate)} • ${matchedEvent.venue}` : 'Expo Venue'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  backgroundColor: matchedEvent?.isDisplayedOnWall ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                  color: matchedEvent?.isDisplayedOnWall ? '#6ee7b7' : '#94a3b8',
                                }}
                              >
                                {matchedEvent?.isDisplayedOnWall ? 'Live Broadcast' : 'Hidden'}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  backgroundColor: matchedEvent?.isAcceptingFeedback ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: matchedEvent?.isAcceptingFeedback ? '#93c5fd' : '#fca5a5',
                                }}
                              >
                                {matchedEvent?.isAcceptingFeedback ? 'Accepting' : 'Paused'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#fed7aa' }}>
                              {evt.totalAccepted}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 800, color: '#fef08a' }}>
                                  {Number(evt.averageRating).toFixed(1)}
                                </span>
                                <SvgStar filled size={14} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Department Breakdown Bar with 3D Rounded Cylindrical Progress Meters */}
            {Object.keys(analytics.departmentBreakdown).length > 0 && (
              <div style={{ backgroundColor: 'rgba(20, 16, 56, 0.45)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
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
        {/* TAB 4: IMMUTABLE 3D AUDIT TRAIL LOG                            */}
        {/* ============================================================== */}
        {activeTab === 'audit' && (
          <section className="pegboard-panel" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            evt.action.includes('hide')
                              ? '#f04328'
                              : evt.action.includes('restore') || evt.action.includes('CREATED')
                              ? '#4cd995'
                              : evt.action.includes('delete')
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
                      {evt.feedbackId && (
                        <span style={{ color: '#cbd5e1' }}>Feedback ID: {evt.feedbackId.slice(0, 8)}...</span>
                      )}
                      {evt.eventId && (
                        <span style={{ color: '#a78bfa' }}>Event ID: {evt.eventId.slice(0, 8)}...</span>
                      )}
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
