import crypto from 'crypto';

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}
