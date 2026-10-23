# DevBappa Solutions Live Feedback Wall

An interactive, real-time, physical pinboard-styled sticky note feedback wall built for **DevBappa Solutions** for college Tech Expos.

Visitors at the tech expo scan an external QR code on their mobile phones to submit authentic thoughts, feedback, and questions. Submissions persist in a PostgreSQL database and animate dynamically onto an enormous continuous pinboard canvas in real time.

---

## Features

- **Physical Sticky-Note Pinboard Canvas**:
  - Enormous continuous 2D world canvas with organic spiral dispersion.
  - Multi-dimensional paper drop shadows, realistic pushpins (copper, brass, silver), gentle curled corners, and natural rotation variations (-4° to +4°).
  - Fluid mobile gestures: Pinch-to-zoom, drag-to-pan, double-tap zoom, and tap-to-inspect.
  - Compact navigation actions: `Reset View` (fit all notes overview) and `Latest` (pan to newest note).
  - Spatial culling / virtualization: maintains 60 FPS on mobile and 4K expo displays.
- **Role-Adaptive Submission Flow**:
  - Three distinct visitor roles: `Student`, `Faculty`, `Other Visitor`.
  - Conditional fields: Predefined department dropdown with `Other` reveal, designation for faculty, institution/organization for visitors.
  - Note color customization: Yellow, Amber, Orange, Pink, Lavender, Blue, Mint.
- **Privacy Firewall**:
  - Full names are strictly retained privately in the database for authorized administration.
  - Only approved public first names and feedback appear on the public wall and public history.
- **Durable Offline Queue (IndexedDB)**:
  - If expo WiFi or cellular connectivity drops, submissions are safely queued in local device storage with an idempotency key.
  - Automatic idempotent retry when connection returns; items are only removed upon authoritative server confirmation.
- **Real-Time Synchronization (Socket.IO)**:
  - Immediate state propagation for new notes, moderation actions (hide/restore/soft-delete), and authoritative submission counts.
  - Realtime events are strictly emitted **only after** transactional database commit.
- **Private Admin Dashboard (`/admin`)**:
  - Protected by secure HttpOnly SameSite cookie sessions and rate-limiting.
  - Real-time database metrics: total accepted, visible, hidden, deleted, and department breakdowns.
  - Moderation controls with confirmation modals: Hide, Restore, Soft-Delete, and Recovery.
  - Immutable audit trail recording administrative actions.
- **Searchable Public History (`/history`)**:
  - Server-side search and role filtering with pagination.
- **No QR code anywhere in website UI**: As required, the website UI never renders internal QR codes; visitors access the app via external physical expo posters/displays.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript (strict mode), Vite, React Router, Socket.IO Client, idb (IndexedDB), Modern CSS Tokens |
| **Backend** | Node.js 22, Express, TypeScript, Socket.IO, PostgreSQL (`pg`), Bcrypt, Zod, Pino Structured Logging |
| **Database** | Neon-hosted PostgreSQL (cloud/serverless with SSL) |
| **Deployment** | Vercel (Frontend SPA), Render (Backend Web Service), Neon (PostgreSQL) |

---

## Repository Structure

```text
devbappa-live-feedback-wall/
├── apps/
│   ├── web/                         # React 18 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/          # Brand Logo, Header, StickyNote, PinboardCanvas
│   │   │   ├── features/            # Submission form, History, Offline queue, Admin
│   │   │   ├── hooks/               # useSocket, useOfflineQueue
│   │   │   ├── services/            # Typed REST API client
│   │   │   └── styles/              # Design tokens, physical note paper & pin styles
│   │   ├── vercel.json              # SPA routing & security headers for Vercel
│   │   └── vite.config.ts
│   └── api/                         # Node 22 + Express backend
│       ├── src/
│       │   ├── db/                  # PostgreSQL migrations, pool & repositories
│       │   ├── middleware/          # Auth, error, rate-limit, validate
│       │   ├── modules/             # Health, feedback, history, stats, canvas, admin
│       │   ├── realtime/            # Socket.IO server & event broadcasters
│       │   ├── security/            # Password hasher, session generator
│       │   └── utils/               # Structured logger, name sanitizer
│       └── tests/                   # API, validation, security & sanitizer tests
├── packages/
│   └── shared/                      # Shared schemas (Zod), types & constants
├── docs/                            # In-depth architectural & deployment guides
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
├── render.yaml                      # Render deployment specification
├── package.json                     # Monorepo workspaces configuration
└── LICENSE                          # MIT License
```

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher (tested with `v22.17.0`)
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: Local PostgreSQL 14+ or cloud Neon database instance

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vedant040106/EchoBoard_DevBappa.git
   cd live_feedback
   ```

2. **Install all monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` in `apps/api` and `apps/web`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   In `apps/api/.env`, configure your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devbappa_feedback
   ADMIN_INITIAL_ID=admin
   ADMIN_INITIAL_PASSWORD=ChangeMeInProduction123!
   ```

4. **Run Database Migrations**:
   ```bash
   npm run db:migrate --workspace=@devbappa/api
   ```

5. **Bootstrap Initial Admin**:
   ```bash
   npm run db:seed --workspace=@devbappa/api
   ```

---

## Development Commands

Run both the API server (port 4000) and Web frontend (port 5173) concurrently:
```bash
npm run dev
```

Run individually:
```bash
npm run dev:api    # Starts Express API with tsx watch
npm run dev:web    # Starts Vite dev server with proxy
```

---

## Testing & Quality Gates

Run all unit, integration, and security tests across all workspaces:
```bash
npm run test
```

Type check all workspaces:
```bash
npm run typecheck
```

Production builds:
```bash
npm run build
```

---

## Deployment Summary

- **Frontend (Vercel)**:
  - Root Directory: `./` (leave default)
  - Build Command: `npm run vercel-build` (auto-detected via `vercel.json`)
  - Output Directory: `apps/web/dist`
  - Environment variables: `VITE_API_BASE_URL`, `VITE_SOCKET_URL`
- **Backend (Render)**:
  - Build Command: `npm install && npm run build --workspace=@devbappa/shared && npm run build --workspace=@devbappa/api`
  - Start Command: `npm run start --workspace=@devbappa/api`
  - Health check: `/api/v1/health`
- **Database (Neon)**:
  - Managed serverless PostgreSQL with SSL mode enabled.
  - See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full walkthrough.

---

## Security Notes

- No secrets or production credentials are committed.
- Full visitor names are shielded behind a server-side privacy firewall.
- Cookie sessions are set with `HttpOnly` and `SameSite`.
- All database queries are parameterized; no raw SQL string concatenation.
- Rate-limiting prevents submission spam and brute-force login attempts.

---

## License

MIT © 2026 DevBappa Solutions / Vedant
