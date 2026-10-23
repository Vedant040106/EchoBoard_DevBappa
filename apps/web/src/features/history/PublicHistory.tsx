import React, { useState, useEffect, useCallback } from 'react';
import type { PublicFeedbackNote, Role } from '@devbappa/shared';
import { api } from '../../services/api.js';
import { NoteDetailModal } from '../../components/sticky-note/NoteDetailModal.js';

export const PublicHistory: React.FC = () => {
  const [notes, setNotes] = useState<PublicFeedbackNote[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspectedNote, setInspectedNote] = useState<PublicFeedbackNote | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPublicHistory({
        search: debouncedSearch.trim() || undefined,
        role: selectedRole === 'All' ? undefined : selectedRole,
        page,
        limit: 12,
      });
      setNotes(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load public feedback history');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedRole, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRoleFilter = (r: Role | 'All') => {
    setSelectedRole(r);
    setPage(1);
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-outer)',
        padding: '36px 20px 64px 20px',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header and Search Filters */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'var(--text-title-xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Public Feedback History
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)' }}>
            Search and explore all verified feedback shared by students, faculty, and expo guests.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            backgroundColor: 'var(--bg-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by first name or message keyword..."
              style={{
                width: '100%',
                height: '44px',
                padding: '0 36px 0 14px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: 'var(--text-body)',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['All', 'Student', 'Faculty', 'Other Visitor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleFilter(r)}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: selectedRole === r ? 800 : 600,
                  backgroundColor:
                    selectedRole === r ? 'var(--accent-orange)' : 'var(--bg-surface-elevated)',
                  color: selectedRole === r ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${selectedRole === r ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Total results info */}
        <div style={{ marginBottom: '16px', fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          Showing {notes.length} of {totalCount} public feedback notes
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div
              style={{
                display: 'inline-block',
                width: '32px',
                height: '32px',
                border: '3px solid rgba(249, 115, 22, 0.3)',
                borderTopColor: 'var(--accent-orange)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '12px',
              }}
            />
            <div style={{ fontSize: 'var(--text-body)' }}>Loading verified feedback...</div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--status-offline-subtle)',
              border: '1px solid var(--status-offline)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              textAlign: 'center',
            }}
          >
            <p style={{ marginBottom: '12px', fontSize: 'var(--text-body)' }}>{error}</p>
            <button
              onClick={fetchHistory}
              style={{
                height: '40px',
                padding: '0 20px',
                backgroundColor: 'var(--accent-orange)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && notes.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No feedback found
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
              No notes match your current search query or filter.
            </p>
          </div>
        )}

        {/* Grid of Sticky Note Cards */}
        {!isLoading && !error && notes.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {notes.map((note) => {
              const colorClass = `note-${note.colorVariant || 'yellow'}`;
              const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={note.id}
                  onClick={() => setInspectedNote(note)}
                  className={colorClass}
                  style={{
                    padding: '20px',
                    borderRadius: '2px 2px 8px 2px',
                    boxShadow: 'var(--shadow-paper)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px',
                    transform: `rotate(${((note.layout.rotation || 0) * 0.4).toFixed(1)}deg)`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                    color: 'var(--note-ink-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-paper-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `rotate(${((note.layout.rotation || 0) * 0.4).toFixed(1)}deg)`;
                    e.currentTarget.style.boxShadow = 'var(--shadow-paper)';
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '8px',
                      }}
                    >
                      <strong style={{ fontFamily: 'var(--font-brand)', fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--note-ink-primary)' }}>
                        {note.publicDisplayName}
                      </strong>
                      <span
                        style={{
                          fontSize: 'var(--text-micro)',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          color: 'var(--note-ink-secondary)',
                        }}
                      >
                        {note.role}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-handwriting)',
                        fontSize: '20px',
                        lineHeight: 'var(--lh-tight)',
                        fontWeight: 700,
                        color: 'var(--note-ink-primary)',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      "{note.message}"
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 600,
                      color: 'var(--note-ink-meta)',
                    }}
                  >
                    <span>{note.department || note.institutionName || ''}</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              style={{
                height: '42px',
                padding: '0 18px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                color: page <= 1 ? 'var(--text-muted)' : '#ffffff',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 700,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>

            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              style={{
                height: '42px',
                padding: '0 18px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                color: page >= totalPages ? 'var(--text-muted)' : '#ffffff',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 700,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      <NoteDetailModal note={inspectedNote} onClose={() => setInspectedNote(null)} />
    </div>
  );
};
