import { describe, it, expect } from 'vitest';
import type { Request, Response } from 'express';
import { validationResult, type FieldValidationError } from 'express-validator';
import { submitValidators, rejectValidators } from '../middleware/vacationValidators';

async function runValidators(validators: any[], body: object) {
  const req = { body } as Request;
  for (const v of validators) {
    await v(req, {} as Response, () => {});
  }
  return validationResult(req);
}

describe('submitValidators', () => {
  it('passes with valid dates', async () => {
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-01',
      endDate: '2025-07-05',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('passes when start and end are the same date', async () => {
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-01',
      endDate: '2025-07-01',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('fails when startDate is missing', async () => {
    const result = await runValidators(submitValidators, { endDate: '2025-07-05' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'startDate')).toBe(true);
  });

  it('fails when endDate is missing', async () => {
    const result = await runValidators(submitValidators, { startDate: '2025-07-01' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'endDate')).toBe(true);
  });

  it('fails when endDate is before startDate', async () => {
    const result = await runValidators(submitValidators, {
      startDate: '2025-07-10',
      endDate: '2025-07-01',
    });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'endDate')).toBe(true);
  });

  it('fails when date format is invalid', async () => {
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
    const result = await runValidators(rejectValidators, { comment: '' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });

  it('fails when comment is missing', async () => {
    const result = await runValidators(rejectValidators, {});
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });

  it('fails when comment is only whitespace', async () => {
    const result = await runValidators(rejectValidators, { comment: '   ' });
    expect(result.array().some((e) => (e as FieldValidationError).path === 'comment')).toBe(true);
  });
});
