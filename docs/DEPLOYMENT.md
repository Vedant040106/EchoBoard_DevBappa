# DevBappa Solutions Live Feedback Wall — Deployment Guide

This guide covers step-by-step production deployment to **Vercel** (Frontend), **Render** (Backend), and **Neon** (PostgreSQL).

## 1. Neon PostgreSQL Database Setup

1. Sign in to [Neon](https://neon.tech) and create a new project named `devbappa-live-feedback-wall`.
2. Copy the PostgreSQL connection string. Ensure it includes `?sslmode=require`:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```
3. Test connectivity locally:
   ```bash
   DATABASE_URL="your-neon-url" npm run db:migrate --workspace=@devbappa/api
   ```
4. The migration runner will automatically initialize `_migrations`, `feedback`, `canvas_layout`, `admin_users`, `admin_sessions`, and `audit_events`.

---

## 2. Render Backend Deployment

1. Sign in to [Render](https://render.com) and create a **New Web Service**.
2. Connect the GitHub repository `Vedant040106/EchoBoard_DevBappa`.
3. Configure service settings:
   - **Environment**: Node
   - **Build Command**:
     ```bash
     npm install && npm run build --workspace=@devbappa/shared && npm run build --workspace=@devbappa/api
     ```
   - **Start Command**:
     ```bash
     npm run start --workspace=@devbappa/api
     ```
   - **Health Check Path**: `/api/v1/health`
4. Configure Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `[your-neon-connection-string]`
   - `APP_ORIGIN`: `https://[your-vercel-domain].vercel.app`
   - `CORS_ORIGINS`: `https://[your-vercel-domain].vercel.app`
   - `SESSION_SECRET`: `[generate a random 64-character secret]`
   - `ADMIN_INITIAL_ID`: `admin`
   - `ADMIN_INITIAL_PASSWORD`: `[strong production admin password]`
5. Deploy service. Once live, test the health check at `https://[your-render-service].onrender.com/api/v1/health`.

---

## 3. Vercel Frontend Deployment

1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import `Vedant040106/EchoBoard_DevBappa`.
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://[your-render-service].onrender.com`
   - `VITE_SOCKET_URL`: `https://[your-render-service].onrender.com`
5. Deploy. Vercel automatically honors `apps/web/vercel.json` for SPA route rewriting (`/submit`, `/history`, `/admin`, `/admin/dashboard`).

---

## 4. End-to-End Verification

1. Open frontend URL on mobile phone browser and desktop browser.
2. Verify live indicator displays `LIVE`.
3. Submit a test feedback note as a Student or Faculty.
4. Verify note immediately animates onto the continuous pinboard wall in real time.
5. Verify `/history` lists the public note with only the public first name.
6. Log in to `/admin` using provisioned credentials and verify moderation controls (Hide, Restore, Soft-Delete).
