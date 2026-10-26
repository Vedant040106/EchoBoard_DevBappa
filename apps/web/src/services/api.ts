import type {
  PublicFeedbackNote,
  FeedbackSubmissionInput,
  PublicStats,
  AdminAnalytics,
  AdminFeedbackItem,
  PaginatedData,
  AdminLoginInput,
  AuditEventItem,
  ApiResponse,
  PublicEvent,
  AdminEventItem,
  CreateEventInput,
  UpdateEventInput,
} from '@devbappa/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

const AUTH_TOKEN_KEY = 'echoboard_admin_token';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach stored admin session token if available (supports cross-domain deployments where third-party cookies are blocked)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Include credentials for HttpOnly admin cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, config);
  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse response from server',
    },
  }));

  if (!response.ok || !data.success) {
    const errorMsg = data.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).code = data.error?.code;
    (error as any).details = data.error?.details;
    (error as any).status = response.status;
    throw error;
  }

  return data.data as T;
}

export const api = {
  // Public
  getHealth: () => request<{ status: string; database: { connected: boolean } }>('/health'),
  getPublicEvents: () =>
    request<{ wallEvents: PublicEvent[]; activeSubmissionEvents: PublicEvent[] }>('/events/public'),
  getPublicNotes: () => request<PublicFeedbackNote[]>('/feedback'),
  getPublicNoteById: (id: string) => request<PublicFeedbackNote>(`/feedback/${id}`),
  submitFeedback: (payload: FeedbackSubmissionInput) =>
    request<PublicFeedbackNote>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPublicHistory: (params: {
    search?: string;
    role?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.eventId) query.set('eventId', params.eventId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<PaginatedData<PublicFeedbackNote>>(`/history?${query.toString()}`);
  },
  getPublicStats: () => request<PublicStats>('/stats'),
  getCanvasLayout: () => request<Array<{ feedbackId: string } & PublicFeedbackNote['layout']>>('/canvas/layout'),

  // Admin Auth
  adminLogin: async (credentials: AdminLoginInput) => {
    const res = await request<{ adminId: string; token: string; expiresAt: string }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res?.token && typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    }
    return res;
  },
  adminGetSession: () => request<{ authenticated: boolean; adminId: string }>('/admin/auth/session'),
  adminLogout: async () => {
    try {
      return await request<{ message: string }>('/admin/auth/logout', {
        method: 'POST',
      });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  },

  // Admin Events & Wall Selection
  adminGetEvents: () => request<AdminEventItem[]>('/admin/events'),
  adminCreateEvent: (payload: CreateEventInput) =>
    request<AdminEventItem>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateEvent: (id: string, payload: UpdateEventInput) =>
    request<AdminEventItem>(`/admin/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminSetWallSelection: (eventIds: string[]) =>
    request<{ activeWallEvents: PublicEvent[]; selectedCount: number }>('/admin/events/wall-selection', {
      method: 'PUT',
      body: JSON.stringify({ eventIds }),
    }),

  // Admin Feedback & Moderation
  adminGetFeedback: (params: {
    search?: string;
    role?: string;
    status?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.eventId && params.eventId !== 'all') query.set('eventId', params.eventId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<PaginatedData<AdminFeedbackItem>>(`/admin/feedback?${query.toString()}`);
  },
  adminGetAnalytics: (eventId?: string) => {
    const query = eventId && eventId !== 'all' ? `?eventId=${eventId}` : '';
    return request<AdminAnalytics>(`/admin/analytics${query}`);
  },
  adminHideFeedback: (id: string) =>
    request<PublicFeedbackNote>(`/admin/feedback/${id}/hide`, { method: 'POST' }),
  adminRestoreFeedback: (id: string) =>
    request<PublicFeedbackNote>(`/admin/feedback/${id}/restore`, { method: 'POST' }),
  adminSoftDeleteFeedback: (id: string) =>
    request<{ message: string }>(`/admin/feedback/${id}/soft-delete`, { method: 'POST' }),
  adminRecoverFeedback: (id: string) =>
    request<{ message: string }>(`/admin/feedback/${id}/recover`, { method: 'POST' }),
  adminGetAudit: (params: { feedbackId?: string; eventId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.feedbackId) query.set('feedbackId', params.feedbackId);
    if (params.eventId) query.set('eventId', params.eventId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<PaginatedData<AuditEventItem>>(`/admin/audit?${query.toString()}`);
  },
};
