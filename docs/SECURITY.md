# DevBappa Solutions Live Feedback Wall — Security & Abuse Prevention

This document specifies the security controls, data privacy policies, authentication architecture, and threat mitigation measures implemented in the application.

## 1. Visitor Data Privacy & Full Name Protection

- **Separation of Identity**:
  - Full visitor names (`full_name`) are stored privately in the PostgreSQL database for administrative moderation and expo audit purposes.
  - Only the approved public display name (`public_display_name`, normally first name) is rendered on the public wall and returned in public endpoints (`/api/v1/feedback`, `/api/v1/history`).
- **Server-Side Enforcement**:
  - Client-supplied public display names are validated server-side to guarantee they belong to the submitted full name. Unrelated or spoofed names are rejected or fall back to the first name.
  - Database queries for public endpoints use explicit column projections; `full_name` is never selected or serialized in public REST or WebSocket payloads.
- **Log Redaction**:
  - Structured pino logging automatically redacts `full_name`, `password`, `cookie`, `session`, `token`, and secret fields.

---

## 2. Admin Authentication & Session Management

- **Password Storage**:
  - Password hashes are computed using bcrypt with 12 salt rounds.
  - Raw passwords are never stored or logged.
- **Session Tokens**:
  - Cryptographically secure 256-bit random tokens generated via `crypto.randomBytes(32)`.
  - Persisted in `admin_sessions` with strict TTL (24 hours).
  - Set via `HttpOnly`, `SameSite` cookies (`SameSite=None; Secure` in production; `SameSite=Lax` in local development).
  - Fallback support for `Authorization: Bearer <token>` for API integrations.
- **Generic Failure Responses**:
  - Authentication failure responses return a generic message ("Invalid administrative credentials provided") without disclosing whether an admin ID exists.
- **Rate Limiting**:
  - Public submission endpoint: 30 requests per 15 minutes per IP.
  - Admin login endpoint: 10 login attempts per 15 minutes per IP.

---

## 3. Network & Transport Security

- **Security Headers**:
  - Express uses `helmet` for `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- **CORS Allowlist**:
  - Configurable origin allowlist (`CORS_ORIGINS`). Cross-origin requests from unlisted domains are rejected with `403 Forbidden`.
- **Payload Limits**:
  - JSON body parser is restricted to `50kb` to prevent memory exhaustion attacks.
- **Parameterized SQL**:
  - All database queries use parameterized SQL via `pg`. Raw user strings are never concatenated into SQL statements.

---

## 4. Idempotency & Replay Defense

- Every submission carries an `idempotencyKey`.
- Submissions with identical keys return the existing persisted note without duplicating database records or re-emitting real-time events.
- Reconciles uncertain network outcomes safely.
