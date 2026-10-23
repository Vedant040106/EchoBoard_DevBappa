# DevBappa Solutions Live Feedback Wall — API Specification

Base prefix: `/api/v1`

## 1. Public Endpoints

### `GET /api/v1/health`
Health check for uptime monitors and deployment runners (Render / Vercel).
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-23T06:00:00.000Z",
    "database": {
      "connected": true,
      "latencyMs": 4
    },
    "uptimeSeconds": 1420
  }
  ```

### `GET /api/v1/feedback`
Retrieves all active, visible sticky notes for the live wall.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c1f7b884-7a1a-4632-a567-5d22eaef7c6d",
        "publicDisplayName": "Vedant",
        "role": "Student",
        "department": "Computer Engineering",
        "designation": null,
        "institutionName": null,
        "message": "Loved the DevBappa robotics project demonstration!",
        "createdAt": "2026-10-23T06:15:00.000Z",
        "colorVariant": "yellow",
        "pinVariant": "brass",
        "sizeVariant": "standard",
        "layout": {
          "worldX": 120,
          "worldY": -85,
          "rotation": 2.5,
          "width": 240,
          "height": 240,
          "layerOrder": 1
        }
      }
    ]
  }
  ```

### `POST /api/v1/feedback`
Submits feedback from visitor's mobile browser.
- **Rate Limit**: 30 requests / 15 minutes.
- **Request Body**:
  ```json
  {
    "name": "Dr. Sunita Sharma",
    "role": "Faculty",
    "department": "Information Technology",
    "designation": "Head of Department",
    "message": "Inspiring student talent and exceptional organization.",
    "confirmedDisplayName": "Dr. Sunita",
    "idempotencyKey": "uuid-or-unique-string-12345",
    "colorVariant": "mint"
  }
  ```
- **Response `201 Created` / `200 OK (idempotent replay)`**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### `GET /api/v1/history`
Searchable, paginated public feedback history.
- **Query Parameters**:
  - `search`: string (optional)
  - `role`: `'Student' | 'Faculty' | 'Other Visitor'` (optional)
  - `page`: integer >= 1 (default `1`)
  - `limit`: integer (1-50, default `12`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "items": [ ... ],
      "total": 42,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  }
  ```

### `GET /api/v1/stats`
Authoritative accepted submission counts.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "totalAccepted": 128,
      "students": 84,
      "faculty": 26,
      "otherVisitors": 18,
      "lastUpdated": "2026-10-23T06:30:00.000Z"
    }
  }
  ```

---

## 2. Admin Authentication & Management Endpoints

All admin endpoints require an active session cookie or `Authorization: Bearer <session-token>`.

### `POST /api/v1/admin/auth/login`
- **Request Body**:
  ```json
  {
    "adminId": "admin",
    "password": "SecretPassword123!"
  }
  ```
- **Response `200 OK`**: Sets `devbappa_admin_session` HttpOnly cookie.

### `GET /api/v1/admin/auth/session`
Verifies current admin session.

### `POST /api/v1/admin/auth/logout`
Destroys session and clears cookie.

### `GET /api/v1/admin/feedback`
Admin feedback list with full private names and status filters (`all`, `visible`, `hidden`, `deleted`).

### `GET /api/v1/admin/analytics`
Complete breakdown of roles, departments, visible, hidden, and soft-deleted notes.

### `POST /api/v1/admin/feedback/:id/hide`
Hides a note from the public wall and history. Records audit event and emits `feedback:hidden`.

### `POST /api/v1/admin/feedback/:id/restore`
Restores a hidden note. Records audit event and emits `feedback:restored`.

### `POST /api/v1/admin/feedback/:id/soft-delete`
Marks `deleted_at = NOW()`. Records audit event and emits `feedback:deleted`.

### `POST /api/v1/admin/feedback/:id/recover`
Restricted recovery of soft-deleted records.

### `GET /api/v1/admin/audit`
Paginated audit trail of all moderation actions.

---

## 3. Realtime Socket.IO Events

| Event Name | Direction | Payload Description |
|------------|-----------|---------------------|
| `feedback:new` | Server -> Client | Committed public feedback note |
| `feedback:hidden` | Server -> Client | `{ id: string }` |
| `feedback:restored` | Server -> Client | Restored public feedback note with layout |
| `feedback:deleted` | Server -> Client | `{ id: string }` |
| `stats:updated` | Server -> Client | Updated authoritative stats |
| `canvas:layout_updated`| Server -> Client | `{ feedbackId: string, layout: CanvasNoteLayout }` |
