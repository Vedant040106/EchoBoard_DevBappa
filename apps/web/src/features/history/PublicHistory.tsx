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
      className="studio-wall-backdrop"
      style={{
        padding: '32px 20px 64px 20px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header and Title */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              backgroundColor: 'rgba(22, 18, 64, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 'var(--radius-full)',
              color: '#fed7aa',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f04328',
                boxShadow: '0 0 8px #f04328',
              }}
            />
            <span>DevBappa Solutions Tech Expo</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'var(--text-title-xl)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Public Pegboard Archive
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: '#cbd5e1', lineHeight: 'var(--lh-normal)' }}>
            Search and explore all verified feedback shared by students, faculty, and expo guests on the 3D studio wall.
          </p>
        </div>

        {/* Filter Controls Bar (Floating Violet Shelf) */}
        <div
          className="studio-shelf-header"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            padding: '16px 20px',
            borderRadius: '16px',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by first name or message keyword..."
              className="studio-input-well"
              style={{
                height: '42px',
                paddingRight: '36px',
                fontSize: '13px',
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
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Role Filter Buttons (3D Studio Push-Buttons) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['All', 'Student', 'Faculty', 'Other Visitor'] as const).map((r) => {
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRoleFilter(r)}
                  className={`btn-3d-studio ${isSelected ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                  style={{
                    height: '38px',
                    padding: '0 14px',
                    fontSize: '12px',
                    backgroundColor: isSelected ? undefined : 'rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pegboard Frame Container */}
        <div
          className="pegboard-panel"
          style={{
            padding: '28px 24px',
            marginBottom: '28px',
          }}
        >
          {/* Total results info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#fed7aa',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>Showing {notes.length} of {totalCount} public feedback notes pinned</span>
            <span style={{ color: '#cbd5e1' }}>Page {page} of {totalPages}</span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#ffffff' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#f04328',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '14px',
                }}
              />
              <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading verified feedback from studio...</div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div
              style={{
                padding: '24px',
                backgroundColor: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                color: '#991b1b',
                textAlign: 'center',
              }}
            >
              <p style={{ marginBottom: '14px', fontSize: '14px', fontWeight: 700 }}>{error}</p>
              <button
                onClick={fetchHistory}
                className="btn-3d-studio btn-3d-orange"
                style={{ height: '40px', padding: '0 20px' }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && notes.length === 0 && (
            <div
              className="studio-pad-card"
              style={{
                textAlign: 'center',
                padding: '50px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#eae8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#634ee2" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181528', marginBottom: '6px' }}>
                No feedback found
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                No public notes match your current search query or role filter.
              </p>
            </div>
          )}

          {/* Grid of 3D Curled Sticky Note Cards Pinned to Pegboard */}
          {!isLoading && !error && notes.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {notes.map((note) => {
                const colorClass = `note-${note.colorVariant || 'yellow'}`;
                const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const rotationDeg = ((note.layout?.rotation || 0) * 0.35).toFixed(1);

                return (
                  <div
                    key={note.id}
                    onClick={() => setInspectedNote(note)}
                    className={colorClass}
                    style={{
                      position: 'relative',
                      padding: '24px 20px 18px 20px',
                      borderRadius: '2px 2px 12px 2px',
                      boxShadow: '10px 16px 28px rgba(12, 16, 68, 0.45), 0 4px 8px rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '220px',
                      transform: `rotate(${rotationDeg}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
                      borderTop: '1px solid rgba(255, 255, 255, 0.7)',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.45)',
                      color: 'var(--note-ink-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03) translateY(-4px)';
                      e.currentTarget.style.boxShadow = '14px 24px 38px rgba(12, 16, 68, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${rotationDeg}deg)`;
                      e.currentTarget.style.boxShadow = '10px 16px 28px rgba(12, 16, 68, 0.45), 0 4px 8px rgba(0, 0, 0, 0.2)';
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
                        background: 'radial-gradient(circle at 35% 35%, #ffedd5 0%, #f04328 65%, #991b1b 100%)',
                        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                        border: '1px solid #7f1d1d',
                        zIndex: 4,
                      }}
                    />

                    {/* Adhesive highlight */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        pointerEvents: 'none',
                      }}
                    />

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ fontFamily: 'var(--font-brand)', fontSize: '16px', fontWeight: 800, color: 'var(--note-ink-primary)' }}>
                          {note.publicDisplayName}
                        </strong>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
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
                          fontSize: '21px',
                          lineHeight: '1.25',
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
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--note-ink-meta)',
                        borderTop: '1px dashed rgba(20, 22, 31, 0.16)',
                        paddingTop: '8px',
                      }}
                    >
                      <span>{note.department || note.institutionName || 'Visitor'}</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="btn-3d-studio btn-3d-violet"
              style={{ height: '42px', padding: '0 20px' }}
            >
              Previous
            </button>

            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fed7aa' }}>
              Page <strong style={{ color: '#ffffff' }}>{page}</strong> of <strong style={{ color: '#ffffff' }}>{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="btn-3d-studio btn-3d-violet"
              style={{ height: '42px', padding: '0 20px' }}
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
