import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'password',
      'passwordHash',
      'password_hash',
      'token',
      'sessionSecret',
      'full_name',
      'fullName',
    ],
    censor: '[REDACTED]',
  },
  transport: !config.isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
