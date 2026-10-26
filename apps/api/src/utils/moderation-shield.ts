/**
 * Server-Side Auto-Hold Profanity & Spam Pattern Shield
 * Deterministically checks feedback text for offensive content, hate speech, and spam links/patterns.
 */

const PROFANITY_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|whore|slut|fag|nigger|nigga|chutiya|bhenchod|madarchod|gandu|harami)\b/i,
  /\b(scam|free\s*crypto|telegram\s*@|whatsapp\s*\+|click\s*here\s*to\s*win|viagra|casino)\b/i,
  /https?:\/\/[^\s]+/i, // external URLs
  /([a-zA-Z0-9])\1{7,}/i, // excessive character repeating e.g. 'aaaaaaa'
];

export interface ModerationCheckResult {
  isFlagged: boolean;
  reason?: string;
}

export function checkModerationShield(text: string): ModerationCheckResult {
  if (!text) return { isFlagged: false };

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isFlagged: true,
        reason: `Matched filter pattern: ${pattern.toString()}`,
      };
    }
  }

  return { isFlagged: false };
}
