import type {
  Role,
  NoteColor,
  PinVariant,
  NoteSize,
  VisibilityStatus,
  ApiErrorCode,
  DoodleType,
} from '../constants/index.js';
import type { FeedbackSubmissionInput } from '../schemas/index.js';

export interface CanvasNoteLayout {
  worldX: number;
  worldY: number;
  rotation: number;
  width: number;
  height: number;
  layerOrder: number;
}

export interface PublicEvent {
  id: string;
  name: string;
  slug: string;
  eventDate: string; // YYYY-MM-DD
  venue: string;
  description: string | null;
  isDisplayedOnWall?: boolean;
  isAcceptingFeedback?: boolean;
}

export interface AdminEventItem {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  venue: string;
  description: string | null;
  isDisplayedOnWall: boolean;
  isAcceptingFeedback: boolean;
  totalSubmissions: number;
  visibleCount: number;
  hiddenCount: number;
  deletedCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicFeedbackNote {
  id: string;
  publicDisplayName: string;
  role: Role;
  department: string | null;
  designation: string | null;
  institutionName: string | null;
  message: string;
  rating: number;
  doodleType: DoodleType;
  eventId: string;
  event?: {
    id: string;
    name: string;
    eventDate: string;
    venue: string;
  } | null;
  createdAt: string;
  colorVariant: NoteColor;
  pinVariant: PinVariant;
  sizeVariant: NoteSize;
  layout: CanvasNoteLayout;
}

export interface AdminFeedbackItem {
  id: string;
  fullName: string;
  publicDisplayName: string;
  role: Role;
  department: string | null;
  designation: string | null;
  institutionName: string | null;
  message: string;
  rating: number;
  doodleType: DoodleType;
  eventId: string;
  event?: {
    id: string;
    name: string;
    eventDate: string;
    venue: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  visibilityStatus: VisibilityStatus;
  deletedAt: string | null;
  idempotencyKey: string;
  colorVariant: NoteColor;
  pinVariant: PinVariant;
  sizeVariant: NoteSize;
  layout: CanvasNoteLayout;
}

export interface PublicStats {
  totalAccepted: number;
  totalAcceptedCount?: number;
  visibleWallCount?: number;
  students: number;
  faculty: number;
  otherVisitors: number;
  averageRating: number;
  activeWallEvents: PublicEvent[];
  lastUpdated: string;
}

export interface AdminAnalytics {
  totalAccepted: number;
  totalVisible: number;
  totalHidden: number;
  totalDeleted: number;
  autoHeldCount?: number;
  averageRating: number;
  roleBreakdown: {
    Student: number;
    Faculty: number;
    'Other Visitor': number;
  };
  departmentBreakdown: Record<string, number>;
  eventsAnalytics?: Array<{
    eventId: string;
    name: string;
    totalAccepted: number;
    averageRating: number;
  }>;
}

export interface AuditEventItem {
  id: string;
  adminId: string;
  feedbackId: string | null;
  eventId?: string | null;
  action: 'hide' | 'restore' | 'soft-delete' | 'recover' | 'update-layout' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_WALL_SELECTION_CHANGED' | 'AUTO_MODERATED_HOLD' | string;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  timestamp: string;
  correlationId: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    correlationId?: string;
  };
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OfflineQueuedSubmission {
  idempotencyKey: string;
  submission: FeedbackSubmissionInput;
  queuedAt: number;
  status: 'queued' | 'syncing' | 'failed';
  errorMessage?: string;
  retryCount: number;
}

export interface AdminSessionInfo {
  authenticated: boolean;
  adminId: string;
  expiresAt?: string;
}
