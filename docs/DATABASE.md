# DevBappa Solutions Live Feedback Wall — Database Specification

This document details the relational schema, constraints, migrations, indexing strategy, and Neon PostgreSQL setup.

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    FEEDBACK ||--|| CANVAS_LAYOUT : "has layout"
    FEEDBACK ||--o{ AUDIT_EVENTS : "audited by"
    ADMIN_USERS ||--o{ ADMIN_SESSIONS : "holds"
    ADMIN_USERS ||--o{ AUDIT_EVENTS : "performs"

    FEEDBACK {
        uuid id PK
        varchar(60) full_name "Private"
        varchar(60) public_display_name "Public"
        varchar(30) role "Student | Faculty | Other Visitor"
        varchar(100) department
        varchar(100) designation
        varchar(150) institution_name
        text message
        varchar(20) visibility_status "'visible' | 'hidden'"
        timestamptz deleted_at "Soft delete"
        varchar(128) idempotency_key UK
        varchar(20) color_variant
        varchar(20) pin_variant
        varchar(20) size_variant
        timestamptz created_at
        timestamptz updated_at
    }

    CANVAS_LAYOUT {
        uuid id PK
        uuid feedback_id FK,UK
        double_precision world_x
        double_precision world_y
        double_precision rotation
        double_precision width
        double_precision height
        integer layer_order
        timestamptz updated_at
    }

    ADMIN_USERS {
        varchar(64) id PK
        varchar(64) username UK
        varchar(255) password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    ADMIN_SESSIONS {
        varchar(128) id PK
        varchar(64) admin_id FK
        timestamptz expires_at
        timestamptz created_at
    }

    AUDIT_EVENTS {
        uuid id PK
        varchar(64) admin_id
        uuid feedback_id FK
        varchar(50) action "'hide' | 'restore' | 'soft-delete' | 'recover' | 'update-layout'"
        jsonb previous_state
        jsonb new_state
        timestamptz timestamp
        varchar(128) correlation_id
    }
```

---

## 2. Table Specifications & Indexes

### `feedback` Table
- Stores visitor submissions.
- **Privacy Firewall**: `full_name` is strictly private and never returned in public APIs. `public_display_name` is validated and derived server-side.
- **Indexes**:
  - `idx_feedback_created_at`: For ordering recent submissions.
  - `idx_feedback_public_query`: Partial index on `(created_at DESC) WHERE deleted_at IS NULL AND visibility_status = 'visible'`.
  - `idx_feedback_idempotency`: Unique index for duplicate prevention.

### `canvas_layout` Table
- Stores persistent 2D spatial arrangement on the continuous wall.
- **Indexes**:
  - `idx_canvas_layout_coords`: `(world_x, world_y)` for spatial queries.
  - `idx_canvas_layout_layer`: `(layer_order)` for z-index ordering.

### `admin_users` & `admin_sessions` Tables
- Secure server-managed session storage.
- Session expiry is checked on every protected API call via `idx_admin_sessions_expiry`.

### `audit_events` Table
- Immutable append-only audit trail for all moderation operations.

---

## 3. Migration System

Migrations are stored as ordered `.sql` files in `apps/api/src/db/migrations/`.
The migration runner:
- Creates the `_migrations` table if not present.
- Executes pending migrations sequentially inside transactions.
- Run manually with:
  ```bash
  npm run db:migrate --workspace=@devbappa/api
  ```
- Executed automatically on API startup.

---

## 4. Neon PostgreSQL Configuration

Neon connection URLs require SSL mode enabled:
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```
The connection pool in `apps/api/src/db/index.ts` automatically detects `.neon.tech` or `sslmode=require` and enables SSL with `{ rejectUnauthorized: false }`.
