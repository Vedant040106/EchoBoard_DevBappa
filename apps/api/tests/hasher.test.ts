import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/security/hasher.js';

describe('Security Hasher', () => {
  it('hashes passwords and verifies matching password', async () => {
    const raw = 'SuperSecretExpoPass2026!';
    const hash = await hashPassword(raw);

    assert.notEqual(raw, hash);
    assert.equal(hash.length > 20, true);

    const matches = await verifyPassword(raw, hash);
    assert.equal(matches, true);

    const incorrect = await verifyPassword('WrongPassword', hash);
    assert.equal(incorrect, false);
  });
});
