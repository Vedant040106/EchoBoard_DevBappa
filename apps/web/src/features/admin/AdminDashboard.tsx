import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  AdminAnalytics,
  AdminFeedbackItem,
  AuditEventItem,
  Role,
} from '@devbappa/shared';
import { api } from '../../services/api.js';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & Admin Info
  const [adminId, setAdminId] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'feedback' | 'analytics' | 'audit'>('feedback');

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

  // Confirmation Action State
  const [actionConfirm, setActionConfirm] = useState<{
    id: string;
    action: 'hide' | 'restore' | 'soft-delete' | 'recover';
    displayName: string;
  } | null>(null);

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
        limit: 15,
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
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Verifying administrative authorization...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        minHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-outer)',
        padding: '32px 24px 64px 24px',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '20px',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 'var(--text-title-lg)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>🛡️ Moderation & Analytics</span>
              <span
                style={{
                  fontSize: 'var(--text-micro)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-orange-subtle)',
                  color: 'var(--accent-orange)',
                }}
              >
                Logged in as {adminId}
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                height: '38px',
                padding: '0 16px',
                backgroundColor: 'var(--status-offline-subtle)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'feedback', label: 'Feedback Management' },
              { id: 'analytics', label: 'Expo Analytics' },
              { id: 'audit', label: 'Audit Trail' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                height: '42px',
                padding: '0 20px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${activeTab === t.id ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)'}`,
                backgroundColor:
                  activeTab === t.id ? 'var(--accent-orange)' : 'var(--bg-surface)',
                color: activeTab === t.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: activeTab === t.id ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FEEDBACK MANAGEMENT */}
        {activeTab === 'feedback' && (
          <div>
            {/* Quick Metrics Bar */}
            {analytics && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-micro)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Total Accepted
                  </div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: 'var(--accent-yellow)' }}>
                    {analytics.totalAccepted}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-micro)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Currently Visible
                  </div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: '#34d399' }}>
                    {analytics.totalVisible}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-micro)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Hidden by Admin
                  </div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: '#f59e0b' }}>
                    {analytics.totalHidden}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-micro)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Soft-Deleted
                  </div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: '#f87171' }}>
                    {analytics.totalDeleted}
                  </div>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                backgroundColor: 'var(--bg-surface)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by full name, display name, message, or department..."
                style={{
                  flex: '1 1 260px',
                  height: '42px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                }}
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                }}
              >
                <option value="all">Status: All</option>
                <option value="visible">Status: Visible</option>
                <option value="hidden">Status: Hidden</option>
                <option value="deleted">Status: Soft-Deleted</option>
              </select>

              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as any);
                  setPage(1);
                }}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                }}
              >
                <option value="All">Role: All</option>
                <option value="Student">Role: Student</option>
                <option value="Faculty">Role: Faculty</option>
                <option value="Other Visitor">Role: Other Visitor</option>
              </select>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-body-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: 'var(--text-caption)' }}>
                    <th style={{ padding: '12px 16px' }}>Private Full Name</th>
                    <th style={{ padding: '12px 16px' }}>Public First Name</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Department / Org</th>
                    <th style={{ padding: '12px 16px' }}>Feedback Message</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingFeedback ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading feedback records...
                      </td>
                    </tr>
                  ) : feedbackItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No records match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    feedbackItems.map((item) => {
                      const isDeleted = item.deletedAt !== null;
                      const isHidden = item.visibilityStatus === 'hidden';

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            backgroundColor: isDeleted
                              ? 'rgba(239, 68, 68, 0.05)'
                              : isHidden
                              ? 'rgba(245, 158, 11, 0.05)'
                              : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                            {item.fullName}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--accent-yellow)' }}>
                            {item.publicDisplayName}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {item.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {item.department || item.institutionName || '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              maxWidth: '280px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={item.message}
                          >
                            "{item.message}"
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {isDeleted ? (
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px' }}>DELETED</span>
                            ) : isHidden ? (
                              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '11px' }}>HIDDEN</span>
                            ) : (
                              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '11px' }}>VISIBLE</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {!isDeleted && !isHidden && (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'hide',
                                      displayName: item.publicDisplayName,
                                    })
                                  }
                                  style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid #f59e0b',
                                    borderRadius: 'var(--radius-xs)',
                                    color: '#f59e0b',
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Hide
                                </button>
                              )}

                              {!isDeleted && isHidden && (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'restore',
                                      displayName: item.publicDisplayName,
                                    })
                                  }
                                  style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10b981',
                                    borderRadius: 'var(--radius-xs)',
                                    color: '#34d399',
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Restore
                                </button>
                              )}

                              {!isDeleted && (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'soft-delete',
                                      displayName: item.publicDisplayName,
                                    })
                                  }
                                  style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    backgroundColor: 'var(--status-offline-subtle)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: 'var(--radius-xs)',
                                    color: '#f87171',
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Soft-Delete
                                </button>
                              )}

                              {isDeleted && (
                                <button
                                  onClick={() =>
                                    setActionConfirm({
                                      id: item.id,
                                      action: 'recover',
                                      displayName: item.publicDisplayName,
                                    })
                                  }
                                  style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid #3b82f6',
                                    borderRadius: 'var(--radius-xs)',
                                    color: '#60a5fa',
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Recover
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: 'var(--text-caption)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Total {totalCount} records (Page {page} of {totalPages})
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page <= 1}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-xs)',
                        color: page <= 1 ? 'var(--text-muted)' : '#ffffff',
                        fontSize: 'var(--text-caption)',
                        fontWeight: 700,
                        cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page >= totalPages}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-xs)',
                        color: page >= totalPages ? 'var(--text-muted)' : '#ffffff',
                        fontSize: 'var(--text-caption)',
                        fontWeight: 700,
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EXPO ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Role Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Role Engagement Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Students</div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: 'var(--accent-orange)' }}>
                    {analytics.roleBreakdown.Student}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Faculty Members</div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: 'var(--accent-yellow)' }}>
                    {analytics.roleBreakdown.Faculty}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Other Visitors</div>
                  <div style={{ fontSize: 'var(--text-title-xl)', fontWeight: 800, color: '#38bdf8' }}>
                    {analytics.roleBreakdown['Other Visitor']}
                  </div>
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Department Distribution
              </h3>
              {Object.keys(analytics.departmentBreakdown).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body-sm)' }}>
                  No department data submitted yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics.departmentBreakdown).map(([dept, count]) => {
                    const percentage = Math.round((count / (analytics.totalAccepted || 1)) * 100);
                    return (
                      <div key={dept}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dept}</span>
                          <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: 'var(--accent-orange)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Admin ID</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Feedback ID</th>
                  <th style={{ padding: '12px 16px' }}>State Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAudit ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading audit events...
                    </td>
                  </tr>
                ) : auditEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditEvents.map((event) => (
                    <tr key={event.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent-yellow)' }}>
                        {event.adminId}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            color: 'var(--accent-orange)',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {event.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {event.feedbackId}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {event.newState ? JSON.stringify(event.newState) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {auditTotalPages > 1 && (
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Audit Page {auditPage} of {auditTotalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setAuditPage((p) => Math.max(p - 1, 1))}
                    disabled={auditPage <= 1}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: auditPage <= 1 ? 'var(--text-muted)' : '#fff',
                      cursor: auditPage <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setAuditPage((p) => Math.min(p + 1, auditTotalPages))}
                    disabled={auditPage >= auditTotalPages}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: auditPage >= auditTotalPages ? 'var(--text-muted)' : '#fff',
                      cursor: auditPage >= auditTotalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Consequential Actions */}
      {actionConfirm && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(5, 6, 12, 0.78)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 28px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Confirm Moderation Action
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)', marginBottom: '24px' }}>
              Are you sure you want to <strong>{actionConfirm.action.toUpperCase()}</strong> feedback from{' '}
              <strong style={{ color: 'var(--accent-yellow)' }}>{actionConfirm.displayName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionConfirm(null)}
                style={{
                  height: '40px',
                  padding: '0 18px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                style={{
                  height: '40px',
                  padding: '0 20px',
                  backgroundColor:
                    actionConfirm.action === 'soft-delete' ? 'var(--status-offline)' : 'var(--accent-orange)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: actionConfirm.action === 'soft-delete' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : '0 4px 12px var(--accent-glow)',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
