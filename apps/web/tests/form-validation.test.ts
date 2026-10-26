import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackSubmissionSchema, ROLES, PREDEFINED_DEPARTMENTS } from '@devbappa/shared';

describe('Frontend Form Validation & Conditional Role Fields', () => {
  it('allows valid Student with predefined department', () => {
    const valid = {
      name: 'Pooja Deshmukh',
      role: 'Student',
      department: 'Information Technology',
      message: 'Great demonstrations at the robotics stall!',
      idempotencyKey: 'idemp-pooja-1',
    };
    const res = feedbackSubmissionSchema.safeParse(valid);
    assert.equal(res.success, true);
  });

  it('enforces departmentOther when department is Other for Student', () => {
    const missingOther = {
      name: 'Pooja Deshmukh',
      role: 'Student',
      department: 'Other',
      departmentOther: '',
      message: 'Great demonstrations at the robotics stall!',
      idempotencyKey: 'idemp-pooja-2',
    };
    const res = feedbackSubmissionSchema.safeParse(missingOther);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.error.issues[0].path[0], 'departmentOther');
    }
  });

  it('enforces designation for Faculty', () => {
    const facultyNoDesig = {
      name: 'Prof. Ramesh Kadam',
      role: 'Faculty',
      department: 'Mechanical Engineering',
      message: 'Exemplary work by the organising committee.',
      idempotencyKey: 'idemp-faculty-1',
    };
    const res = feedbackSubmissionSchema.safeParse(facultyNoDesig);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.error.issues[0].path[0], 'designation');
    }

    const facultyValid = {
      ...facultyNoDesig,
      designation: 'Assistant Professor',
    };
    assert.equal(feedbackSubmissionSchema.safeParse(facultyValid).success, true);
  });

  it('enforces institutionName for Other Visitor and ignores department', () => {
    const visitorNoInst = {
      name: 'Aditya Mehta',
      role: 'Other Visitor',
      message: 'Excited to see the college tech startups.',
      idempotencyKey: 'idemp-visitor-1',
    };
    assert.equal(feedbackSubmissionSchema.safeParse(visitorNoInst).success, false);

    const visitorValid = {
      ...visitorNoInst,
      institutionName: 'Infosys Ltd.',
    };
    assert.equal(feedbackSubmissionSchema.safeParse(visitorValid).success, true);
  });

  it('validates rating between 1 and 5', () => {
    const base = {
      name: 'Aditya Mehta',
      role: 'Other Visitor',
      institutionName: 'Infosys Ltd.',
      message: 'Excited to see the college tech startups.',
      idempotencyKey: 'idemp-visitor-rating',
    };

    // Valid ratings: 1, 3, 5
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 1 }).success, true);
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 3 }).success, true);
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 5 }).success, true);

    // Invalid ratings: 0, 6, -1, 3.5
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 0 }).success, false);
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 6 }).success, false);
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, rating: 3.5 }).success, false);
  });

  it('accepts optional UUID eventId', () => {
    const base = {
      name: 'Aditya Mehta',
      role: 'Other Visitor',
      institutionName: 'Infosys Ltd.',
      message: 'Excited to see the college tech startups.',
      idempotencyKey: 'idemp-visitor-event',
      rating: 5,
    };

    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, eventId: 'b942a447-1cde-4610-b8ba-a9ee4e27fd43' }).success, true);
    assert.equal(feedbackSubmissionSchema.safeParse({ ...base, eventId: 'not-a-uuid' }).success, false);
  });
});
