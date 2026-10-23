import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackSubmissionSchema, adminLoginSchema } from '@devbappa/shared';

describe('Validation Schemas', () => {
  it('validates a valid Student submission', () => {
    const input = {
      name: 'Rohan Patil',
      role: 'Student',
      department: 'Computer Engineering',
      message: 'Great demonstrations at the tech expo! Loved the AI projects.',
      idempotencyKey: 'idemp-student-12345',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, true);
  });

  it('rejects Student submission without department', () => {
    const input = {
      name: 'Rohan Patil',
      role: 'Student',
      message: 'Loved the AI projects.',
      idempotencyKey: 'idemp-student-12345',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0].path[0], 'department');
    }
  });

  it('requires departmentOther when department is Other for Student', () => {
    const input = {
      name: 'Rohan Patil',
      role: 'Student',
      department: 'Other',
      message: 'Great project presentations.',
      idempotencyKey: 'idemp-student-12345',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0].path[0], 'departmentOther');
    }
  });

  it('validates Faculty submission with designation and department', () => {
    const input = {
      name: 'Dr. Sunita Kulkarni',
      role: 'Faculty',
      department: 'Information Technology',
      designation: 'Head of Department',
      message: 'Impressive innovation and high standard of student engineering.',
      idempotencyKey: 'idemp-faculty-67890',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, true);
  });

  it('rejects Faculty submission without designation', () => {
    const input = {
      name: 'Dr. Sunita Kulkarni',
      role: 'Faculty',
      department: 'Information Technology',
      message: 'Impressive innovation.',
      idempotencyKey: 'idemp-faculty-67890',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0].path[0], 'designation');
    }
  });

  it('validates Other Visitor with institutionName and no department required', () => {
    const input = {
      name: 'Vikram Joshi',
      role: 'Other Visitor',
      institutionName: 'Tata Consultancy Services',
      message: 'Exceptional talent and well-organized event booths.',
      idempotencyKey: 'idemp-visitor-99999',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, true);
  });

  it('rejects Other Visitor without institutionName', () => {
    const input = {
      name: 'Vikram Joshi',
      role: 'Other Visitor',
      message: 'Exceptional talent.',
      idempotencyKey: 'idemp-visitor-99999',
    };

    const parsed = feedbackSubmissionSchema.safeParse(input);
    assert.equal(parsed.success, false);
  });

  it('enforces message length limits', () => {
    const tooShort = {
      name: 'A',
      role: 'Student',
      department: 'Civil Engineering',
      message: 'Hi', // too short (< 5 chars)
      idempotencyKey: 'idemp-short-123',
    };
    assert.equal(feedbackSubmissionSchema.safeParse(tooShort).success, false);
  });

  it('validates admin login schema', () => {
    assert.equal(
      adminLoginSchema.safeParse({ adminId: 'admin', password: 'password123' }).success,
      true
    );
    assert.equal(adminLoginSchema.safeParse({ adminId: '', password: '123' }).success, false);
  });
});
