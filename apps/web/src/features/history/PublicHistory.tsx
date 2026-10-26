import React, { useState, useEffect, useCallback } from 'react';
import type { PublicFeedbackNote, Role, PublicEvent } from '@devbappa/shared';
import { api } from '../../services/api.js';
import { NoteDetailModal } from '../../components/sticky-note/NoteDetailModal.js';

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

export const PublicHistory: React.FC = () => {
  const [notes, setNotes] = useState<PublicFeedbackNote[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const [selectedEventId, setSelectedEventId] = useState<string>('All');
  const [wallEvents, setWallEvents] = useState<PublicEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspectedNote, setInspectedNote] = useState<PublicFeedbackNote | null>(null);

  // Fetch wall events on mount for filter selector
  useEffect(() => {
    api
      .getPublicEvents()
      .then((data) => {
        if (data?.wallEvents) {
          setWallEvents(data.wallEvents);
        }
      })
      .catch(() => {});
  }, []);

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
        eventId: selectedEventId === 'All' ? undefined : selectedEventId,
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
  }, [debouncedSearch, selectedRole, selectedEventId, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRoleFilter = (r: Role | 'All') => {
    setSelectedRole(r);
    setPage(1);
  };

  const handleEventFilter = (evtId: string) => {
    setSelectedEventId(evtId);
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
            <span>DevBappa Solutions • Multi-Event Live Feedback Wall</span>
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
            Search and explore all verified feedback and star ratings shared across DevBappa events.
          </p>
        </div>

        {/* Filter Controls Bar (Floating Violet Shelf) */}
        <div
          className="studio-shelf-header"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '28px',
            padding: '18px 20px',
            borderRadius: '16px',
          }}
        >
          {/* Top Row: Search Box & Event Dropdown */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
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

            {/* Event Filter Dropdown */}
            {wallEvents.length > 0 && (
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  htmlFor="history-event-filter"
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#fed7aa',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Filter by Event:
                </label>
                <select
                  id="history-event-filter"
                  value={selectedEventId}
                  onChange={(e) => handleEventFilter(e.target.value)}
                  className="studio-input-well"
                  style={{
                    height: '42px',
                    minWidth: '220px',
                    backgroundColor: 'rgba(15, 17, 28, 0.95)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <option value="All">All Wall Events ({wallEvents.length})</option>
                  {wallEvents.map((evt) => (
                    <option key={evt.id} value={evt.id} style={{ backgroundColor: '#181528', color: '#ffffff' }}>
                      {evt.name} — {formatDisplayDate(evt.eventDate)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bottom Row: Role Filter Push-Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#cbd5e1',
              }}
            >
              Role:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['All', 'Student', 'Faculty', 'Other Visitor'] as const).map((r) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleFilter(r)}
                    className={`btn-3d-studio ${isSelected ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                    style={{
                      height: '34px',
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
              flexWrap: 'wrap',
              gap: '8px',
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
                No public notes match your current search query or event filter.
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
                const noteRating = note.rating || 5;

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
                      minHeight: '230px',
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
                    {/* Top Adhesive Strip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.22)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Hand-Drawn Doodle Watermark Stamp */}
                    {note.doodleType && note.doodleType !== 'none' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '34px',
                          right: '16px',
                          width: '75px',
                          height: '75px',
                          opacity: 0.12,
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'rotate(-8deg)',
                          color: 'var(--note-ink-primary)',
                        }}
                      >
                        {note.doodleType === 'lightning' ? (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        ) : note.doodleType === 'heart' ? (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        ) : note.doodleType === 'spark' ? (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        ) : note.doodleType === 'spiral' ? (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 1 0 10 10 7.5 7.5 0 1 0-7.5-7.5 5 5 0 1 0 5 5 2.5 2.5 0 1 0-2.5-2.5" />
                          </svg>
                        ) : note.doodleType === 'lightbulb' ? (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7z" />
                          </svg>
                        ) : (
                          <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}

                    <div>
                      {/* Name and Role */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '6px',
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

                      {/* SVG Star Rating */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginBottom: '8px',
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <SvgStar key={s} filled={s <= noteRating} size={13} />
                        ))}
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--note-ink-secondary)', marginLeft: '4px' }}>
                          {noteRating} / 5
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

                    {/* Footer: Event & Venue Tag */}
                    <div
                      style={{
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--note-ink-meta)',
                        borderTop: '1px dashed rgba(20, 22, 31, 0.16)',
                        paddingTop: '8px',
                      }}
                    >
                      {note.event && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#634ee2', fontWeight: 800 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {note.event.name}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{note.department || note.institutionName || 'Visitor'}</span>
                        <span>{formattedDate}</span>
                      </div>
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
