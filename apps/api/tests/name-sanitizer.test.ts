import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { derivePublicDisplayName } from '../src/utils/name-sanitizer.js';

describe('Name Sanitizer & Privacy Protection', () => {
  it('extracts first name by default for multi-part full names', () => {
    const result = derivePublicDisplayName('Dr. Rajesh Kumar Sharma');
    assert.equal(result, 'Dr.');

    const result2 = derivePublicDisplayName('Vedant Angre');
    assert.equal(result2, 'Vedant');
  });

  it('handles single word names', () => {
    const result = derivePublicDisplayName('Ananya');
    assert.equal(result, 'Ananya');
  });

  it('accepts confirmed display name if it matches part of full name', () => {
    const result = derivePublicDisplayName('Vedant Angre', 'Vedant');
    assert.equal(result, 'Vedant');

    const result2 = derivePublicDisplayName('Vedant Angre', 'Ved');
    assert.equal(result2, 'Ved');
  });

  it('falls back safely to first name if confirmed display name is malicious or unrelated', () => {
    const result = derivePublicDisplayName('Vedant Angre', 'SuperAdmin Hacker');
    assert.equal(result, 'Vedant');
  });

  it('strips control characters and HTML tags', () => {
    const result = derivePublicDisplayName('<script>alert("xss")</script> Rajesh');
    assert.equal(result.includes('<script>'), false);
  });
});
