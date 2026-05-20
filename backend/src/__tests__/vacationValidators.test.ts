import { describe, it, expect } from 'vitest';
import type { Request, Response } from 'express';
import { validationResult, type FieldValidationError } from 'express-validator';
import { submitValidators, rejectValidators } from '../middleware/vacationValidators';

// Unit tests — no database needed, only the validation rule logic is tested.

// Helper: runs a list of express-validator rules against a fake request body
// and returns the collected validation result so each test can inspect it.
async function runValidators(validators: any[], body: object) {
  const req = { body } as Request;
  for (const v of validators) {
    await v(req, {} as Response, () => {}); // no-op next() — we only care about errors
  }
  return validationResult(req);
}

describe('submitValidators', () => {
  it('passes with valid dates', async () => {
    // Both dates present, correct format, end after start — no errors expected.
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-01',
      endDate: '2025-07-05',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('passes when start and end are the same date', async () => {
    // A single-day vacation is valid — end equal to start must be allowed.
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-01',
      endDate: '2025-07-01',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('fails when startDate is missing', async () => {
    // Omitting startDate must produce an error on the "startDate" field.
    const result = await runValidators(submitValidators, { endDate: '2025-07-05' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'startDate')).toBe(true);
  });

  it('fails when endDate is missing', async () => {
    const result = await runValidators(submitValidators, { startDate: '2025-07-01' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'endDate')).toBe(true);
  });

  it('fails when endDate is before startDate', async () => {
    // The custom validator checks date order — July 1 as end with July 10 as start is invalid.
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-10',
      endDate: '2025-07-01',
    });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'endDate')).toBe(true);
  });

  it('fails when date format is invalid', async () => {
    // Dates must be YYYY-MM-DD. The common MM/DD/YYYY format must be rejected.
    const result = await runValidators(submitValidators, {
      startDate: '07/01/2025',
      endDate: '07/05/2025',
    });
    expect(result.isEmpty()).toBe(false);
  });
});

describe('rejectValidators', () => {
  it('passes with a non-empty comment', async () => {
    const result = await runValidators(rejectValidators, { comment: 'Too many requests' });
    expect(result.isEmpty()).toBe(true);
  });

  it('fails when comment is empty', async () => {
    // An empty string is not a valid rejection comment.
    const result = await runValidators(rejectValidators, { comment: '' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });

  it('fails when comment is missing', async () => {
    // Omitting the field entirely must also fail.
    const result = await runValidators(rejectValidators, {});
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });

  it('fails when comment is only whitespace', async () => {
    // The validator trims the value before the notEmpty check,
    // so spaces-only is treated the same as an empty string.
    const result = await runValidators(rejectValidators, { comment: '   ' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });
});
