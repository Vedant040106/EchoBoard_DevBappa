import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { API_ERROR_CODES } from '@devbappa/shared';

export const submissionRateLimiter = rateLimit({
  windowMs: config.rateLimit.submissionWindowMs,
  max: config.rateLimit.submissionMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: API_ERROR_CODES.RATE_LIMITED,
      message: 'Too many submissions from this connection. Please wait a few moments before trying again.',
    },
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: API_ERROR_CODES.RATE_LIMITED,
      message: 'Too many login attempts. For security reasons, please wait 15 minutes before trying again.',
    },
  },
});
