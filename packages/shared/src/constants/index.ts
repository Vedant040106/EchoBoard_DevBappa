export const ROLES = ['Student', 'Faculty', 'Other Visitor'] as const;
export type Role = (typeof ROLES)[number];

export const PREDEFINED_DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence & Data Science',
  'Other',
] as const;
export type PredefinedDepartment = (typeof PREDEFINED_DEPARTMENTS)[number];

export const NOTE_COLORS = [
  'yellow',
  'amber',
  'orange',
  'pink',
  'lavender',
  'blue',
  'mint',
] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const PIN_VARIANTS = ['copper', 'brass', 'silver'] as const;
export type PinVariant = (typeof PIN_VARIANTS)[number];

export const NOTE_SIZES = ['small', 'standard', 'large'] as const;
export type NoteSize = (typeof NOTE_SIZES)[number];

export const VISIBILITY_STATUS = ['visible', 'hidden'] as const;
export type VisibilityStatus = (typeof VISIBILITY_STATUS)[number];

export const DOODLE_TYPES = [
  'check',
  'lightning',
  'heart',
  'spark',
  'spiral',
  'lightbulb',
  'none',
] as const;
export type DoodleType = (typeof DOODLE_TYPES)[number];

export const REALTIME_EVENTS = {
  FEEDBACK_NEW: 'feedback:new',
  FEEDBACK_HIDDEN: 'feedback:hidden',
  FEEDBACK_RESTORED: 'feedback:restored',
  FEEDBACK_DELETED: 'feedback:deleted',
  STATS_UPDATED: 'stats:updated',
  LAYOUT_UPDATED: 'canvas:layout_updated',
  WALL_EVENTS_UPDATED: 'wall:events_updated',
} as const;

export const CONNECTION_STATUS = {
  LIVE: 'LIVE',
  RECONNECTING: 'RECONNECTING',
  OFFLINE: 'OFFLINE',
  WAITING_TO_SYNC: 'WAITING TO SYNC',
} as const;
export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export const FIELD_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  MESSAGE_MIN: 5,
  MESSAGE_MAX: 1000,
  DESIGNATION_MIN: 2,
  DESIGNATION_MAX: 100,
  INSTITUTION_MIN: 2,
  INSTITUTION_MAX: 150,
  DEPARTMENT_OTHER_MIN: 2,
  DEPARTMENT_OTHER_MAX: 100,
  EVENT_NAME_MIN: 2,
  EVENT_NAME_MAX: 120,
  VENUE_MIN: 2,
  VENUE_MAX: 200,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
