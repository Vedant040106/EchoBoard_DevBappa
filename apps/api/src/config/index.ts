import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devbappa_feedback',
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
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
