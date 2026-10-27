import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from apps/api/.env as well as monorepo root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devbappa_feedback',
  databaseUrlUnpooled:
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/devbappa_feedback',
  neonBranch: process.env.NEON_BRANCH || 'production',
  neonRealtimeUrl: process.env.NEON_REALTIME_URL,
  neonRealtimeSecret: process.env.NEON_REALTIME_SECRET,
  appOrigin: process.env.APP_ORIGIN || 'https://echoboarddevbappa.vercel.app',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://echoboarddevbappa.vercel.app')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  sessionSecret: process.env.SESSION_SECRET || 'devbappa-default-development-session-secret-change-in-prod',
  sessionCookieName: 'devbappa_admin_session',
  sessionTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  adminInitialId: process.env.ADMIN_INITIAL_ID || 'admin',
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMeInProduction123!',
  rateLimit: {
    submissionWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    submissionMax: parseInt(process.env.RATE_LIMIT_MAX_SUBMISSIONS || '30', 10),
    loginMax: parseInt(process.env.RATE_LIMIT_MAX_LOGIN_ATTEMPTS || '10', 10),
  },
};
