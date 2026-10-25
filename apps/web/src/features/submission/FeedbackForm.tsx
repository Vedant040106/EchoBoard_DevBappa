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
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `devbappa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

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
                : 'Your note is now pinned to the 3D pegboard studio wall for everyone at the Tech Expo to see.'}
            </p>

            {/* Submission Preview Card */}
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
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '10px',
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

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--note-ink-meta)',
                  borderTop: '1px dashed rgba(20, 22, 31, 0.18)',
                  paddingTop: '8px',
                }}
              >
                <span>{submittedNote.department || submittedNote.institutionName || 'Visitor'}</span>
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
                onClick={() => navigate('/')}
                className="btn-3d-studio btn-3d-orange"
                style={{ minWidth: '180px', height: '46px' }}
              >
                View on Live 3D Wall
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
        {/* Studio Top Ledge: DevBappa Badge & Architect Lamp Spotlight Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '10px 18px',
            backgroundColor: 'rgba(22, 18, 64, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#f04328',
                boxShadow: '0 0 10px #f04328',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
              Submission Studio — DevBappa Tech Expo
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fed7aa', fontSize: '12px', fontWeight: 700 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f04328" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Live 3D Pegboard Synced</span>
          </div>
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
                DevBappa Solutions Tech Expo
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
                Share your authentic impressions, questions, or cheers with DevBappa Solutions at the Tech Expo!
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
                  placeholder="What did you enjoy most at the DevBappa booth or Tech Expo?"
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
                  <span style={{ color: '#634ee2', fontWeight: 800 }}>{effectiveDisplayName || 'Visitor'}</span>) and feedback will appear on the public wall.
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
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>Realtime Canvas Sync</span>
            </div>

            {/* Physical Curled Sticky Note Card */}
            <div
              className={`note-${selectedColor}`}
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '320px',
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
              {/* Pushpin at top center */}
              <div
                style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #ffedd5 0%, #f04328 65%, #991b1b 100%)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                  border: '1px solid #7f1d1d',
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: '4px',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    opacity: 0.85,
                  }}
                />
              </div>

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

              {/* Note Header: Name and Role Tag */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
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

                {/* Ink Divider */}
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'rgba(20, 22, 31, 0.12)',
                    marginBottom: '16px',
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
                    minHeight: '110px',
                  }}
                >
                  {message.trim() ? `"${message}"` : 'Your thoughts, impressions, and feedback will be rendered here in handwriting ink...'}
                </div>
              </div>

              {/* Note Footer: Metadata & Today's Date */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '12px',
                  borderTop: '1px dashed rgba(20, 22, 31, 0.16)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--note-ink-meta)',
                }}
              >
                <span>{previewMeta}</span>
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
