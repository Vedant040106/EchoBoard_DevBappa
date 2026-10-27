import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ROLES,
  PREDEFINED_DEPARTMENTS,
  NOTE_COLORS,
  FIELD_LIMITS,
  type Role,
  type NoteColor,
  type FeedbackSubmissionInput,
  type PublicFeedbackNote,
  type PublicEvent,
  type DoodleType,
  feedbackSubmissionSchema,
} from '@devbappa/shared';
import { api } from '../../services/api.js';
import { offlineQueue } from '../offline-queue/offlineQueue.js';
import { Logo } from '../../components/brand/Logo.js';

const CACHED_EVENTS_STORAGE_KEY = 'echoboard_cached_events';
const DEFAULT_TECH_EXPO: PublicEvent = {
  id: '',
  name: 'Tech Expo',
  slug: 'tech-expo-2026-10-23',
  eventDate: '2026-10-23',
  venue: 'VPPCOE&VA, Sion',
  description: 'DevBappa Solutions Live Feedback Wall at Tech Expo — VPPCOE&VA, Sion',
};

export const DOODLE_OPTIONS: Array<{ type: DoodleType; label: string; icon: React.ReactNode }> = [
  {
    type: 'check',
    label: 'Checkmark',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    type: 'lightning',
    label: 'Lightning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    type: 'heart',
    label: 'Heart',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    type: 'spark',
    label: 'Spark Burst',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </svg>
    ),
  },
  {
    type: 'spiral',
    label: 'Spiral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10 7.5 7.5 0 1 0-7.5-7.5 5 5 0 1 0 5 5 2.5 2.5 0 1 0-2.5-2.5" />
      </svg>
    ),
  },
  {
    type: 'lightbulb',
    label: 'Lightbulb',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7z" />
      </svg>
    ),
  },
  {
    type: 'none',
    label: 'None',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
];

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const RATING_LABELS: Record<number, string> = {
  1: '1 - Poor',
  2: '2 - Fair',
  3: '3 - Good',
  4: '4 - Great',
  5: '5 - Outstanding',
};

const SvgStar: React.FC<{ filled: boolean; size?: number; color?: string }> = ({
  filled,
  size = 18,
  color = '#f59e0b',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={filled ? '#d97706' : 'rgba(20, 22, 31, 0.35)'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
export const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();

  // Multi-Event State with Render Cold-Start Shield (<100ms render via localStorage)
  const [activeEvents, setActiveEvents] = useState<PublicEvent[]>(() => {
    try {
      const cached = localStorage.getItem(CACHED_EVENTS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [DEFAULT_TECH_EXPO];
  });
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(CACHED_EVENTS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Rating State (1 to 5)
  const [rating, setRating] = useState<number>(5);

  // Hand-Drawn Ink Doodle Stamp State (Zero Emojis)
  const [doodleType, setDoodleType] = useState<DoodleType>('check');

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Student');
  const [department, setDepartment] = useState<string>(PREDEFINED_DEPARTMENTS[0]);
  const [departmentOther, setDepartmentOther] = useState('');
  const [designation, setDesignation] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');
  const [confirmedDisplayName, setConfirmedDisplayName] = useState('');
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedNote, setSubmittedNote] = useState<PublicFeedbackNote | null>(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  // Generate stable idempotency key for this submission attempt
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `devbappa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  // Fetch active submission events on mount & update cache with cold-start wake-up ping
  useEffect(() => {
    let isMounted = true;
    // Immediate background cold-start wake-up ping to /api/v1/health
    api.getHealth().catch(() => {});

    api
      .getPublicEvents()
      .then((data) => {
        if (!isMounted) return;
        if (data?.activeSubmissionEvents && data.activeSubmissionEvents.length > 0) {
          setActiveEvents(data.activeSubmissionEvents);
          setSelectedEventId((prev) => prev || data.activeSubmissionEvents[0].id);
          try {
            localStorage.setItem(
              CACHED_EVENTS_STORAGE_KEY,
              JSON.stringify(data.activeSubmissionEvents)
            );
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Fallback default remains in state
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedEvent =
    activeEvents.find((e) => e.id === selectedEventId) ||
    activeEvents[0] || {
      id: '',
      name: 'Tech Expo',
      slug: 'tech-expo-2026-10-23',
      eventDate: '2026-10-23',
      venue: 'VPPCOE&VA, Sion',
      description: 'DevBappa Solutions Live Feedback Wall at Tech Expo',
    };

  // Compute suggested public display name
  const suggestedDisplayName = name.trim().split(/\s+/)[0] || '';
  const effectiveDisplayName = confirmedDisplayName.trim() || suggestedDisplayName;

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload: FeedbackSubmissionInput = {
      name: name.trim(),
      role,
      department: role === 'Student' || role === 'Faculty' ? (department as any) : undefined,
      departmentOther: department === 'Other' ? departmentOther.trim() : undefined,
      designation: role === 'Faculty' ? designation.trim() : undefined,
      institutionName: role === 'Other Visitor' ? institutionName.trim() : undefined,
      message: message.trim(),
      confirmedDisplayName: effectiveDisplayName || undefined,
      idempotencyKey,
      colorVariant: selectedColor,
      rating,
      doodleType,
      eventId: selectedEventId || undefined,
    };

    // Client-side schema validation
    const validation = feedbackSubmissionSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Attempt online submission
      const note = await api.submitFeedback(payload);
      setSubmittedNote(note);
      setIsOfflineQueued(false);
    } catch (err: any) {
      // 2. If network error or backend offline, queue into IndexedDB
      if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.status >= 500) {
        try {
          await offlineQueue.enqueue(payload);
          setIsOfflineQueued(true);
          setSubmittedNote({
            id: 'queued-temp-id',
            publicDisplayName: effectiveDisplayName || 'Visitor',
            role,
            department:
              role === 'Other Visitor'
                ? null
                : department === 'Other'
                ? departmentOther
                : department,
            designation: role === 'Faculty' ? designation : null,
            institutionName: role === 'Other Visitor' ? institutionName : null,
            message: message.trim(),
            createdAt: new Date().toISOString(),
            colorVariant: selectedColor,
            pinVariant: 'brass',
            sizeVariant: 'standard',
            rating,
            doodleType,
            eventId: selectedEvent.id || 'default-event',
            event: {
              id: selectedEvent.id || 'default-event',
              name: selectedEvent.name,
              eventDate: selectedEvent.eventDate,
              venue: selectedEvent.venue,
            },
            layout: { worldX: 0, worldY: 0, rotation: 0, width: 240, height: 240, layerOrder: 0 },
          });
        } catch {
          setErrors({ form: 'Network error and local offline storage is unavailable in your browser.' });
        }
      } else {
        setErrors({ form: err.message || 'Submission failed. Please check your inputs and try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setName('');
    setMessage('');
    setDepartmentOther('');
    setDesignation('');
    setInstitutionName('');
    setConfirmedDisplayName('');
    setIsEditingDisplayName(false);
    setRating(5);
    setSubmittedNote(null);
    setIsOfflineQueued(false);
    setErrors({});
    setIdempotencyKey(`devbappa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  };

  // SUCCESS SCREEN
  if (submittedNote) {
    const noteRating = submittedNote.rating || rating;
    const noteEventName = submittedNote.event?.name || selectedEvent.name;
    const noteEventDate = submittedNote.event?.eventDate || selectedEvent.eventDate;
    const noteVenue = submittedNote.event?.venue || selectedEvent.venue;

    return (
      <div
        className="studio-wall-backdrop"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <div
          className="pegboard-panel"
          style={{
            width: '100%',
            maxWidth: '560px',
            padding: '36px 28px',
          }}
        >
          <div
            className="studio-pad-card"
            style={{
              padding: '36px 28px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
              <Logo height={42} />
            </div>

            {isOfflineQueued ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  border: '1.5px solid #3b82f6',
                  borderRadius: 'var(--radius-full)',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '14px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Queued — Waiting to Sync</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1.5px solid #059669',
                  borderRadius: 'var(--radius-full)',
                  color: '#065f46',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '14px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Feedback Published to Studio Wall!</span>
              </div>
            )}

            <h2
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '24px',
                fontWeight: 800,
                color: '#181528',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              Thank You for Your Feedback!
            </h2>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(240, 67, 40, 0.1)',
                border: '1px solid rgba(240, 67, 40, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#c2331c',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '18px',
                lineHeight: 1.4,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f04328" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Team DevBappa is thankful for your feedback!</span>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              {isOfflineQueued
                ? 'Your feedback is safely saved in local storage on this phone. As soon as server connectivity returns, it will automatically synchronize and appear on the 3D pegboard wall.'
                : `Your note is now pinned to the 3D pegboard studio wall for ${noteEventName} (${formatDisplayDate(noteEventDate)}).`}
            </p>

            {/* Submission Preview Card with Star Rating & Event Tag */}
            <div
              className={`note-${submittedNote.colorVariant || 'yellow'}`}
              style={{
                margin: '0 auto 28px auto',
                maxWidth: '380px',
                padding: '22px 22px 18px 22px',
                borderRadius: '2px 2px 12px 2px',
                boxShadow: '0 16px 36px rgba(12, 16, 68, 0.35)',
                transform: 'rotate(-1.5deg)',
                textAlign: 'left',
                borderTop: '1px solid rgba(255, 255, 255, 0.7)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                color: 'var(--note-ink-primary)',
                position: 'relative',
              }}
            >
              {/* Top Adhesive Strip */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '22px',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                  pointerEvents: 'none',
                }}
              />

              {/* Hand-Drawn Doodle Watermark Stamp in Success Note */}
              {submittedNote.doodleType && submittedNote.doodleType !== 'none' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '18px',
                    width: '90px',
                    height: '90px',
                    opacity: 0.14,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(-8deg)',
                    color: 'var(--note-ink-primary)',
                  }}
                >
                  {React.cloneElement(
                    (DOODLE_OPTIONS.find((d) => d.type === submittedNote.doodleType) || DOODLE_OPTIONS[0]).icon as React.ReactElement,
                    { width: 80, height: 80, strokeWidth: 1.8 }
                  )}
                </div>
              )}

              {/* Note Header: Name and Role */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '8px',
                  color: 'var(--note-ink-secondary)',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--note-ink-primary)' }}>
                  {submittedNote.publicDisplayName}
                </span>
                <span
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {submittedNote.role}
                </span>
              </div>

              {/* Star Rating Display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '10px',
                }}
              >
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <SvgStar key={starVal} filled={starVal <= noteRating} size={15} />
                ))}
                <span
                  style={{
                    marginLeft: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--note-ink-secondary)',
                  }}
                >
                  {noteRating} / 5
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '22px',
                  lineHeight: '1.3',
                  fontWeight: 700,
                  color: 'var(--note-ink-primary)',
                  marginBottom: '14px',
                }}
              >
                "{submittedNote.message}"
              </div>

              {/* Note Footer: Event & Venue Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--note-ink-meta)',
                  borderTop: '1px dashed rgba(20, 22, 31, 0.18)',
                  paddingTop: '8px',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{noteEventName} • {noteVenue}</span>
                </span>
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(isOfflineQueued ? '/' : `/?highlight=${submittedNote.id}`)}
                className="btn-3d-studio btn-3d-orange"
                style={{ minWidth: '180px', height: '46px' }}
              >
                View My Note on the Wall
              </button>
              <button
                onClick={handleResetForAnother}
                className="btn-3d-studio btn-3d-periwinkle"
                style={{ minWidth: '150px', height: '46px' }}
              >
                Pin Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active department or institution preview string
  const previewMeta =
    role === 'Other Visitor'
      ? institutionName.trim() || 'Institution / Visitor'
      : role === 'Faculty'
      ? `${designation.trim() ? `${designation.trim()}, ` : ''}${
          department === 'Other' ? departmentOther.trim() || 'Other' : department
        }`
      : department === 'Other'
      ? departmentOther.trim() || 'Other Department'
      : department;

  return (
    <div
      className="studio-wall-backdrop"
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      {/* Centered Periwinkle Pegboard Studio Panel */}
      <div
        className="pegboard-panel"
        style={{
          width: '100%',
          maxWidth: '1100px',
          padding: '32px 28px',
        }}
      >
        {/* Prominent 3D Pegboard Event Banner at the Top */}
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            backgroundColor: 'rgba(22, 18, 64, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(8, 10, 32, 0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(240, 67, 40, 0.2)',
                  border: '1px solid rgba(240, 67, 40, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb923c',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {selectedEvent.name}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Accepting Feedback
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#fed7aa',
                    fontWeight: 700,
                    marginTop: '2px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatDisplayDate(selectedEvent.eventDate)}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {selectedEvent.venue}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '12px', fontWeight: 700 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>Live 3D Pegboard Synced</span>
            </div>
          </div>

          {/* Multiple Active Events Selector Dropdown (When > 1 event is accepting feedback) */}
          {activeEvents.length > 1 && (
            <div
              style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <label
                htmlFor="event-selection-dropdown"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#fed7aa',
                  marginBottom: '6px',
                }}
              >
                Attending a Different Event? Choose Your Event:
              </label>
              <select
                id="event-selection-dropdown"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="studio-input-well"
                style={{
                  backgroundColor: 'rgba(15, 17, 28, 0.95)',
                  color: '#ffffff',
                  borderColor: 'rgba(240, 67, 40, 0.45)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {activeEvents.map((evt) => (
                  <option key={evt.id} value={evt.id} style={{ backgroundColor: '#181528', color: '#ffffff' }}>
                    {evt.name} — {formatDisplayDate(evt.eventDate)} ({evt.venue})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Side-by-Side Studio Workspace: Form Pad (Left) & Curled 3D Sticky Note (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Tactile Off-White Studio Pad Card */}
          <div
            className="studio-pad-card"
            style={{
              padding: '32px 26px',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  backgroundColor: 'rgba(240, 67, 40, 0.12)',
                  borderRadius: 'var(--radius-full)',
                  color: '#c2331c',
                  fontSize: 'var(--text-micro)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                }}
              >
                DevBappa Solutions • {selectedEvent.name}
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#181528',
                  letterSpacing: '-0.02em',
                  marginBottom: '4px',
                }}
              >
                Pin Your Feedback
              </h1>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                Share your authentic impressions, questions, and ratings with DevBappa Solutions at {selectedEvent.name}!
              </p>
            </div>

            {errors.form && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#fee2e2',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '18px',
                }}
              >
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="field-name"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2d274e',
                    marginBottom: '6px',
                  }}
                >
                  Full Name <span style={{ color: '#f04328' }}>*</span>
                </label>
                <input
                  id="field-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Patil"
                  maxLength={FIELD_LIMITS.NAME_MAX}
                  required
                  className="studio-input-well"
                  style={{
                    borderColor: errors.name ? '#ef4444' : undefined,
                  }}
                />
                {errors.name && (
                  <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                    {errors.name}
                  </span>
                )}

                {/* Public Display Name Review & Confirmation */}
                {suggestedDisplayName && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#edeafd',
                      border: '1px solid #d4cefa',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#342f61',
                    }}
                  >
                    {!isEditingDisplayName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          Public note display name:{' '}
                          <strong style={{ color: '#5b21b6' }}>{effectiveDisplayName}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingDisplayName(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f04328',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        <input
                          type="text"
                          value={confirmedDisplayName}
                          onChange={(e) => setConfirmedDisplayName(e.target.value)}
                          placeholder={suggestedDisplayName}
                          className="studio-input-well"
                          style={{
                            height: '34px',
                            padding: '0 10px',
                            fontSize: '13px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingDisplayName(false)}
                          className="btn-3d-studio btn-3d-orange"
                          style={{
                            height: '34px',
                            padding: '0 12px',
                            fontSize: '12px',
                          }}
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Overall Experience Rating (1 to 5 Stars) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2d274e',
                    marginBottom: '6px',
                  }}
                >
                  Overall Experience Rating <span style={{ color: '#f04328' }}>*</span>
                </label>
                <div
                  role="radiogroup"
                  aria-label="Overall Experience Rating"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '8px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isSelected = rating === starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={RATING_LABELS[starVal]}
                        onClick={() => setRating(starVal)}
                        className={`btn-3d-studio ${isSelected ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          height: '52px',
                          padding: '4px',
                          backgroundColor: isSelected ? undefined : '#eae8f8',
                          borderTop: isSelected ? undefined : '1px solid #ffffff',
                          borderBottom: isSelected ? undefined : '3px solid #c5c0e8',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <SvgStar
                            filled={isSelected || starVal <= rating}
                            size={18}
                            color={isSelected ? '#ffffff' : '#f59e0b'}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: isSelected ? '#ffffff' : '#475569',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {starVal} {starVal === 1 ? 'Star' : 'Stars'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#c2331c',
                    marginTop: '8px',
                  }}
                >
                  <SvgStar filled size={14} />
                  <span>Selected: {RATING_LABELS[rating]}</span>
                </div>
              </div>

              {/* Role Selection (3D Studio Push Buttons) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2d274e',
                    marginBottom: '6px',
                  }}
                >
                  Your Role <span style={{ color: '#f04328' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {ROLES.map((r) => {
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`btn-3d-studio ${isSelected ? 'btn-3d-orange' : 'btn-3d-ghost'}`}
                        style={{
                          height: '42px',
                          padding: '0 8px',
                          fontSize: '12px',
                          color: isSelected ? '#ffffff' : '#2d274e',
                          backgroundColor: isSelected ? undefined : '#eae8f8',
                          borderTop: isSelected ? undefined : '1px solid #ffffff',
                          borderBottom: isSelected ? undefined : '3px solid #c5c0e8',
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Role Fields: Faculty Designation */}
              {role === 'Faculty' && (
                <div>
                  <label
                    htmlFor="field-designation"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#2d274e',
                      marginBottom: '6px',
                    }}
                  >
                    Designation <span style={{ color: '#f04328' }}>*</span>
                  </label>
                  <input
                    id="field-designation"
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Professor, Assistant Professor, HOD"
                    maxLength={FIELD_LIMITS.DESIGNATION_MAX}
                    required
                    className="studio-input-well"
                    style={{
                      borderColor: errors.designation ? '#ef4444' : undefined,
                    }}
                  />
                  {errors.designation && (
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                      {errors.designation}
                    </span>
                  )}
                </div>
              )}

              {/* Department (Student & Faculty) */}
              {(role === 'Student' || role === 'Faculty') && (
                <div>
                  <label
                    htmlFor="field-department"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#2d274e',
                      marginBottom: '6px',
                    }}
                  >
                    Department <span style={{ color: '#f04328' }}>*</span>
                  </label>
                  <select
                    id="field-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="studio-input-well"
                    style={{
                      cursor: 'pointer',
                      borderColor: errors.department ? '#ef4444' : undefined,
                    }}
                  >
                    {PREDEFINED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} style={{ backgroundColor: '#ffffff', color: '#181528' }}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                      {errors.department}
                    </span>
                  )}

                  {/* If Department is Other */}
                  {department === 'Other' && (
                    <div style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        value={departmentOther}
                        onChange={(e) => setDepartmentOther(e.target.value)}
                        placeholder="Please specify your department"
                        maxLength={FIELD_LIMITS.DEPARTMENT_OTHER_MAX}
                        required
                        className="studio-input-well"
                        style={{
                          borderColor: errors.departmentOther ? '#ef4444' : undefined,
                        }}
                      />
                      {errors.departmentOther && (
                        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {errors.departmentOther}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Institution / Organization (Other Visitor) */}
              {role === 'Other Visitor' && (
                <div>
                  <label
                    htmlFor="field-institution"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#2d274e',
                      marginBottom: '6px',
                    }}
                  >
                    Institution or Organization <span style={{ color: '#f04328' }}>*</span>
                  </label>
                  <input
                    id="field-institution"
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Google, MIT, Independent Researcher"
                    maxLength={FIELD_LIMITS.INSTITUTION_MAX}
                    required
                    className="studio-input-well"
                    style={{
                      borderColor: errors.institutionName ? '#ef4444' : undefined,
                    }}
                  />
                  {errors.institutionName && (
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                      {errors.institutionName}
                    </span>
                  )}
                </div>
              )}

              {/* Note Color Choice */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2d274e',
                    marginBottom: '8px',
                  }}
                >
                  Sticky Note Palette Color
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {NOTE_COLORS.map((c) => {
                    const isSelected = selectedColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`note-${c}`}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          border: isSelected ? '3px solid #634ee2' : '1px solid rgba(0, 0, 0, 0.25)',
                          boxShadow: isSelected ? '0 4px 12px rgba(99, 78, 226, 0.5)' : '0 2px 5px rgba(0, 0, 0, 0.15)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Hand-Drawn Ink Doodle Stamp Selector (Zero Emojis) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2d274e',
                    marginBottom: '8px',
                  }}
                >
                  Hand-Drawn Ink Doodle Stamp
                </label>
                <div
                  role="radiogroup"
                  aria-label="Hand-Drawn Ink Doodle Stamp"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {DOODLE_OPTIONS.map((opt) => {
                    const isSelected = doodleType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setDoodleType(opt.type)}
                        className={`btn-3d-studio ${isSelected ? 'btn-3d-periwinkle' : 'btn-3d-ghost'}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          height: '54px',
                          padding: '4px 6px',
                          backgroundColor: isSelected ? undefined : '#eae8f8',
                          borderTop: isSelected ? undefined : '1px solid #ffffff',
                          borderBottom: isSelected ? undefined : '3px solid #c5c0e8',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: isSelected ? '#ffffff' : '#634ee2' }}>
                          {opt.icon}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: isSelected ? '#ffffff' : '#475569',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Message */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    htmlFor="field-message"
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#2d274e',
                    }}
                  >
                    Feedback <span style={{ color: '#f04328' }}>*</span>
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    {message.length} / {FIELD_LIMITS.MESSAGE_MAX}
                  </span>
                </div>
                <textarea
                  id="field-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What did you enjoy most at the DevBappa booth or at this event?"
                  rows={4}
                  minLength={FIELD_LIMITS.MESSAGE_MIN}
                  maxLength={FIELD_LIMITS.MESSAGE_MAX}
                  required
                  className="studio-input-well"
                  style={{
                    minHeight: '120px',
                    lineHeight: '1.45',
                    resize: 'vertical',
                    borderColor: errors.message ? '#ef4444' : undefined,
                  }}
                />
                {errors.message && (
                  <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Privacy Notice with SVG Shield Icon (Zero Emojis) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  backgroundColor: '#edeafd',
                  border: '1px solid #d4cefa',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#2d274e',
                  lineHeight: '1.5',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#634ee2" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <strong style={{ color: '#181528' }}>Privacy Notice:</strong> Your full name is stored privately for authorized administration. Only your public first name (
                  <span style={{ color: '#634ee2', fontWeight: 800 }}>{effectiveDisplayName || 'Visitor'}</span>), rating, and feedback will appear on the public wall.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-3d-studio btn-3d-orange"
                style={{
                  height: '48px',
                  fontSize: '15px',
                  width: '100%',
                }}
              >
                {isSubmitting ? 'Pinning Note...' : '+ Pin Note to 3D Wall'}
              </button>
            </form>
          </div>

          {/* Right Column: Live Tactile Note Preview Mounted on Pegboard */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '0 4px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fed7aa" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Interactive 3D Post-it Note Preview
              </span>
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>Realtime Sync</span>
            </div>

            {/* Physical Curled Sticky Note Card */}
            <div
              className={`note-${selectedColor}`}
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '340px',
                padding: '28px 24px 20px 24px',
                transform: 'rotate(-1.5deg)',
                boxShadow: '12px 20px 36px rgba(10, 8, 40, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25)',
                borderRadius: '2px 2px 14px 2px',
                borderTop: '1px solid rgba(255, 255, 255, 0.7)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                color: 'var(--note-ink-primary)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Hand-Drawn Ink Doodle Watermark Stamp */}
              {doodleType !== 'none' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '48px',
                    right: '20px',
                    width: '110px',
                    height: '110px',
                    opacity: 0.13,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(-8deg)',
                    color: 'var(--note-ink-primary)',
                  }}
                >
                  {React.cloneElement(
                    (DOODLE_OPTIONS.find((d) => d.type === doodleType) || DOODLE_OPTIONS[0]).icon as React.ReactElement,
                    { width: 100, height: 100, strokeWidth: 1.8 }
                  )}
                </div>
              )}

              {/* Top Adhesive Strip Highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '26px',
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                  pointerEvents: 'none',
                }}
              />

              {/* Note Content */}
              <div>
                {/* Note Header: Name, Role Tag, and Star Rating */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '19px',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      color: 'var(--note-ink-primary)',
                    }}
                  >
                    {effectiveDisplayName || 'Visitor Name'}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(20, 22, 31, 0.08)',
                      color: 'var(--note-ink-primary)',
                    }}
                  >
                    {role}
                  </span>
                </div>

                {/* Geometric Star Rating in Note Preview */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '12px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <SvgStar key={starVal} filled={starVal <= rating} size={15} />
                  ))}
                  <span
                    style={{
                      marginLeft: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--note-ink-secondary)',
                    }}
                  >
                    {rating} / 5
                  </span>
                </div>

                {/* Ink Divider */}
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'rgba(20, 22, 31, 0.12)',
                    marginBottom: '14px',
                  }}
                />

                {/* Handwritten Note Body Preview */}
                <div
                  style={{
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '24px',
                    lineHeight: '1.3',
                    fontWeight: 700,
                    color: 'var(--note-ink-primary)',
                    wordBreak: 'break-word',
                    minHeight: '100px',
                  }}
                >
                  {message.trim() ? `"${message}"` : 'Your thoughts, impressions, and feedback will be rendered here in handwriting ink...'}
                </div>
              </div>

              {/* Note Footer: Metadata & Event Tag */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '10px',
                  borderTop: '1px dashed rgba(20, 22, 31, 0.16)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--note-ink-meta)',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>{previewMeta}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#634ee2', fontWeight: 800 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {selectedEvent.name}
                  </span>
                </div>
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
