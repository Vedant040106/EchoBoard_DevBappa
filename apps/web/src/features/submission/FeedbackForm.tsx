import React, { useState } from 'react';
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
  feedbackSubmissionSchema,
} from '@devbappa/shared';
import { api } from '../../services/api.js';
import { offlineQueue } from '../offline-queue/offlineQueue.js';
import { Logo } from '../../components/brand/Logo.js';

export const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();

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
  const [idempotencyKey, setIdempotencyKey] = useState(() => `devbappa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

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
            department: role === 'Other Visitor' ? null : (department === 'Other' ? departmentOther : department),
            designation: role === 'Faculty' ? designation : null,
            institutionName: role === 'Other Visitor' ? institutionName : null,
            message: message.trim(),
            createdAt: new Date().toISOString(),
            colorVariant: selectedColor,
            pinVariant: 'brass',
            sizeVariant: 'standard',
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
    setSubmittedNote(null);
    setIsOfflineQueued(false);
    setErrors({});
    setIdempotencyKey(`devbappa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  };

  // SUCCESS SCREEN
  if (submittedNote) {
    return (
      <div
        style={{
          height: '100%',
          minHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: 'var(--bg-outer)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Logo height={42} />
          </div>

          {isOfflineQueued ? (
            <div
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                borderRadius: '999px',
                color: '#60a5fa',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
              }}
            >
              Queued — Waiting to sync
            </div>
          ) : (
            <div
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                borderRadius: '999px',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
              }}
            >
              ✓ Feedback Published!
            </div>
          )}

          <h2
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '26px',
              fontWeight: 800,
              color: '#ffffff',
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
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 107, 0, 0.12)',
              border: '1px solid rgba(255, 107, 0, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#fed7aa',
              fontSize: '15px',
              fontWeight: 700,
              marginBottom: '16px',
              lineHeight: 1.4,
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.1)',
            }}
          >
            <span>🧡</span>
            <span>Team DevBappa is thankful for your feedback!</span>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            {isOfflineQueued
              ? 'Your feedback is safely saved in local storage on this phone. As soon as server connectivity returns, it will automatically synchronize and appear on the big screen wall.'
              : 'Your note is now pinned to the live feedback wall for everyone at the Tech Expo to see.'}
          </p>

          {/* Submission Preview Card */}
          <div
            className={`note-${submittedNote.colorVariant || 'yellow'}`}
            style={{
              margin: '0 auto 28px auto',
              padding: '22px 24px',
              borderRadius: '2px 2px 8px 2px',
              boxShadow: 'var(--shadow-paper)',
              transform: 'rotate(-1.5deg)',
              textAlign: 'left',
              borderTop: '1px solid rgba(255, 255, 255, 0.6)',
              color: 'var(--note-ink-primary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-caption)',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--note-ink-secondary)',
              }}
            >
              <span style={{ color: 'var(--note-ink-primary)' }}>{submittedNote.publicDisplayName}</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{submittedNote.role}</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-handwriting)',
                fontSize: '22px',
                lineHeight: 'var(--lh-tight)',
                fontWeight: 700,
                color: 'var(--note-ink-primary)',
              }}
            >
              "{submittedNote.message}"
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                height: '46px',
                padding: '0 18px',
                backgroundColor: 'var(--accent-orange)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: 'var(--text-body)',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--accent-glow)',
                transition: 'opacity 0.2s',
              }}
            >
              View the Wall
            </button>
            <button
              onClick={handleResetForAnother}
              style={{
                flex: 1,
                height: '46px',
                padding: '0 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-body)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
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
        padding: '36px 16px 60px 16px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          padding: '36px 30px',
          alignSelf: 'flex-start',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              backgroundColor: 'var(--accent-orange-subtle)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-orange)',
              fontSize: 'var(--text-micro)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            DevBappa Solutions Tech Expo
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: 'var(--text-title-lg)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Pin Your Feedback
          </h1>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)' }}>
            Share your authentic impressions, questions, or cheers with DevBappa Solutions at the
            Tech Expo!
          </p>
        </div>

        {errors.form && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-offline-subtle)',
              border: '1px solid var(--status-offline)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5',
              fontSize: 'var(--text-body-sm)',
              marginBottom: '20px',
            }}
          >
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="field-name"
              style={{
                display: 'block',
                fontSize: 'var(--text-caption)',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Full Name <span style={{ color: 'var(--accent-orange)' }}>*</span>
            </label>
            <input
              id="field-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohan Patil"
              maxLength={FIELD_LIMITS.NAME_MAX}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: `1px solid ${errors.name ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: 'var(--text-body)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {errors.name && (
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-offline)', marginTop: '4px', display: 'block' }}>
                {errors.name}
              </span>
            )}

            {/* Public Display Name Review & Confirmation */}
            {suggestedDisplayName && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-secondary)',
                }}
              >
                {!isEditingDisplayName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Public note display name:{' '}
                      <strong style={{ color: 'var(--accent-yellow)' }}>{effectiveDisplayName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingDisplayName(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-orange)',
                        fontSize: 'var(--text-caption)',
                        fontWeight: 600,
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
                      style={{
                        flex: 1,
                        height: '34px',
                        padding: '0 10px',
                        backgroundColor: 'var(--bg-outer)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#fff',
                        fontSize: 'var(--text-caption)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingDisplayName(false)}
                      style={{
                        height: '34px',
                        padding: '0 12px',
                        backgroundColor: 'var(--accent-orange)',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        color: '#fff',
                        fontSize: 'var(--text-caption)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-caption)',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Your Role <span style={{ color: 'var(--accent-orange)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  style={{
                    height: '44px',
                    padding: '0 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${
                      role === r ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)'
                    }`,
                    backgroundColor:
                      role === r ? 'var(--accent-orange-subtle)' : 'var(--bg-surface-elevated)',
                    color: role === r ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: role === r ? 800 : 500,
                    fontSize: 'var(--text-caption)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Student / Faculty Fields: Department */}
          {(role === 'Student' || role === 'Faculty') && (
            <div>
              <label
                htmlFor="field-department"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Department <span style={{ color: 'var(--accent-orange)' }}>*</span>
              </label>
              <select
                id="field-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: `1px solid ${errors.department ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body)',
                  outline: 'none',
                }}
              >
                {PREDEFINED_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} style={{ backgroundColor: '#1b1c2b' }}>
                    {dept}
                  </option>
                ))}
              </select>

              {department === 'Other' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    value={departmentOther}
                    onChange={(e) => setDepartmentOther(e.target.value)}
                    placeholder="Please specify your department"
                    maxLength={FIELD_LIMITS.DEPARTMENT_OTHER_MAX}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: `1px solid ${
                        errors.departmentOther ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'
                      }`,
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      fontSize: 'var(--text-body-sm)',
                      outline: 'none',
                    }}
                  />
                  {errors.departmentOther && (
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-offline)', marginTop: '4px', display: 'block' }}>
                      {errors.departmentOther}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conditional Faculty Field: Designation */}
          {role === 'Faculty' && (
            <div>
              <label
                htmlFor="field-designation"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Designation <span style={{ color: 'var(--accent-orange)' }}>*</span>
              </label>
              <input
                id="field-designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Associate Professor, HOD, Dean"
                maxLength={FIELD_LIMITS.DESIGNATION_MAX}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: `1px solid ${errors.designation ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body)',
                  outline: 'none',
                }}
              />
              {errors.designation && (
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-offline)', marginTop: '4px', display: 'block' }}>
                  {errors.designation}
                </span>
              )}
            </div>
          )}

          {/* Conditional Other Visitor Field: Institution Name */}
          {role === 'Other Visitor' && (
            <div>
              <label
                htmlFor="field-institution"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Institution or Organization <span style={{ color: 'var(--accent-orange)' }}>*</span>
              </label>
              <input
                id="field-institution"
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Google, MIT, Independent Researcher"
                maxLength={FIELD_LIMITS.INSTITUTION_MAX}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: `1px solid ${
                    errors.institutionName ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 'var(--text-body)',
                  outline: 'none',
                }}
              />
              {errors.institutionName && (
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-offline)', marginTop: '4px', display: 'block' }}>
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
                fontSize: 'var(--text-caption)',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Note Color
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`note-${c}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: selectedColor === c ? '3px solid #ffffff' : '1px solid rgba(0, 0, 0, 0.25)',
                    boxShadow: selectedColor === c ? '0 0 12px rgba(255, 255, 255, 0.6)' : 'var(--shadow-subtle)',
                    cursor: 'pointer',
                    transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Feedback Message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                htmlFor="field-message"
                style={{
                  fontSize: 'var(--text-caption)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                Feedback <span style={{ color: 'var(--accent-orange)' }}>*</span>
              </label>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                {message.length} / {FIELD_LIMITS.MESSAGE_MAX}
              </span>
            </div>
            <textarea
              id="field-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you enjoy most at the DevBappa booth or Tech Expo?"
              rows={4}
              minLength={FIELD_LIMITS.MESSAGE_MIN}
              maxLength={FIELD_LIMITS.MESSAGE_MAX}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                minHeight: '110px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: `1px solid ${errors.message ? 'var(--status-offline)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--lh-normal)',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            {errors.message && (
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-offline)', marginTop: '4px', display: 'block' }}>
                {errors.message}
              </span>
            )}
          </div>

          {/* Privacy Notice */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--lh-relaxed)',
            }}
          >
            🔒 <strong style={{ color: 'var(--text-primary)' }}>Privacy Notice:</strong> Your full name is stored privately for authorized
            administration. Only your public first name (
            <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>{effectiveDisplayName || 'Visitor'}</span>)
            and feedback will appear on the live Expo wall.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              height: '48px',
              padding: '0 24px',
              backgroundColor: 'var(--accent-orange)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: 'var(--text-body)',
              fontWeight: 800,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: '0 4px 16px var(--accent-glow)',
              transition: 'background-color 0.2s, transform 0.15s ease',
            }}
          >
            {isSubmitting ? 'Pinning Note...' : 'Pin to Wall'}
          </button>
        </form>
      </div>
    </div>
  );
};
