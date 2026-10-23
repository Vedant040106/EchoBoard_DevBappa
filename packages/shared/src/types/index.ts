import type {
  Role,
  NoteColor,
  PinVariant,
  NoteSize,
  VisibilityStatus,
  ApiErrorCode,
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

export interface PublicFeedbackNote {
  id: string;
  publicDisplayName: string;
  role: Role;
  department: string | null;
  designation: string | null;
  institutionName: string | null;
  message: string;
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
  students: number;
  faculty: number;
  otherVisitors: number;
  lastUpdated: string;
}

export interface AdminAnalytics {
  totalAccepted: number;
  totalVisible: number;
  totalHidden: number;
  totalDeleted: number;
  roleBreakdown: {
    Student: number;
    Faculty: number;
    'Other Visitor': number;
  };
  departmentBreakdown: Record<string, number>;
}

export interface AuditEventItem {
  id: string;
  adminId: string;
  feedbackId: string;
  action: 'hide' | 'restore' | 'soft-delete' | 'recover' | 'update-layout';
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
