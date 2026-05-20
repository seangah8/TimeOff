import { describe, it, expect } from 'vitest';
import * as authService from '../api/services/authService';
import * as vacationService from '../api/services/vacationService';
import { UserRole } from '../entities/User';
import { VacationStatus } from '../entities/VacationRequest';

// Integration tests — run against a real test DB that is wiped before each test.

// Helpers to reduce boilerplate: register a user of the correct role and return the record.
async function createRequester(name = 'Requester') {
  const { user } = await authService.register(name, UserRole.Requester);
  return user;
}

async function createValidator(name = 'Validator') {
  const { user } = await authService.register(name, UserRole.Validator);
  return user;
}

describe('vacationService.submit', () => {
  it('creates a pending vacation request', async () => {
    const requester = await createRequester();

    const result = await vacationService.submit(requester.id, '2025-07-01', '2025-07-05', 'Holiday');

    // A freshly submitted request must be Pending with the exact dates and reason stored.
    expect(result).not.toBeNull();
    expect(result!.status).toBe(VacationStatus.Pending);
    expect(result!.startDate).toBe('2025-07-01');
    expect(result!.endDate).toBe('2025-07-05');
    expect(result!.reason).toBe('Holiday');
    expect(result!.requester.id).toBe(requester.id);
  });

  it('throws 409 when overlapping an approved request', async () => {
    const requester = await createRequester();
    const validator = await createValidator();

    // Submit and approve July 1–10, then try to submit July 5–15 (overlaps).
    const req = await vacationService.submit(requester.id, '2025-07-01', '2025-07-10', null);
    await vacationService.approve(req!.id, validator.id);

    await expect(
      vacationService.submit(requester.id, '2025-07-05', '2025-07-15', null),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('vacationService.approve', () => {
  it('approves a pending request and sets the validator', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2025-08-01', '2025-08-05', null);

    const result = await vacationService.approve(req!.id, validator.id);

    // Status must flip to Approved and the validator field must record who acted on it.
    expect(result!.status).toBe(VacationStatus.Approved);
    expect(result!.validator!.id).toBe(validator.id);
  });

  it('throws 404 when the request does not exist', async () => {
    const validator = await createValidator();
    // 99999 will never exist in a freshly wiped test database.
    await expect(vacationService.approve(99999, validator.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the requester tries to approve their own request', async () => {
    // Passing the requester's own id as the validatorId must be blocked.
    const requester = await createRequester();
    const req = await vacationService.submit(requester.id, '2025-09-01', '2025-09-05', null);

    await expect(vacationService.approve(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when the request is already approved', async () => {
    // Approving twice must be blocked — only Pending requests can be approved.
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2025-10-01', '2025-10-05', null);
    await vacationService.approve(req!.id, validator.id);

    await expect(vacationService.approve(req!.id, validator.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('vacationService.deleteRequest', () => {
  it('removes a pending request from the database', async () => {
    const requester = await createRequester();
    const req = await vacationService.submit(requester.id, '2026-02-01', '2026-02-05', null);

    await vacationService.deleteRequest(req!.id, requester.id);

    // Confirm deletion: trying to approve the removed request must return 404.
    await expect(vacationService.approve(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when the request does not exist', async () => {
    const requester = await createRequester();
    await expect(vacationService.deleteRequest(99999, requester.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the requester tries to delete someone else\'s request', async () => {
    // Each requester can only delete their own requests.
    const requester = await createRequester('Requester A');
    const other = await createRequester('Requester B');
    const req = await vacationService.submit(requester.id, '2026-03-01', '2026-03-05', null);

    await expect(vacationService.deleteRequest(req!.id, other.id))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when trying to delete an approved request', async () => {
    // Once approved, the request is read-only — the validator's decision must be preserved.
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-04-01', '2026-04-05', null);
    await vacationService.approve(req!.id, validator.id);

    await expect(vacationService.deleteRequest(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when trying to delete a rejected request', async () => {
    // Same rule applies to rejected requests — the rejection record must be preserved.
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-05-01', '2026-05-05', null);
    await vacationService.reject(req!.id, validator.id, 'Not approved');

    await expect(vacationService.deleteRequest(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('vacationService.getAll', () => {
  it('filters by requester name (case-insensitive partial match)', async () => {
    // Create two requesters and submit one request each so we have data to filter.
    const alice = await createRequester('Alice Smith');
    const bob = await createRequester('Bob Jones');
    await vacationService.submit(alice.id, '2026-06-01', '2026-06-05', null);
    await vacationService.submit(bob.id, '2026-06-06', '2026-06-10', null);

    // Search with lowercase 'alice' — the ILike query should match 'Alice Smith' regardless of case.
    // No status filter (undefined) means all statuses are included.
    const results = await vacationService.getAll(undefined, 50, 0, 'alice');

    // Every returned record must contain 'alice' in the requester name, and Alice's record must be present.
    expect(results.every((r) => r.requester.name.toLowerCase().includes('alice'))).toBe(true);
    expect(results.some((r) => r.requester.name === 'Alice Smith')).toBe(true);
  });
});

describe('vacationService.reject', () => {
  it('rejects a pending request with a comment', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2025-11-01', '2025-11-05', null);

    // Reject the request with a reason comment — this simulates a validator declining the leave.
    const result = await vacationService.reject(req!.id, validator.id, 'Team is too busy');

    // Status must be Rejected, the comment must be stored verbatim, and the acting validator must be recorded.
    expect(result!.status).toBe(VacationStatus.Rejected);
    expect(result!.comment).toBe('Team is too busy');
    expect(result!.validator!.id).toBe(validator.id);
  });

  it('throws 403 when the requester tries to reject their own request', async () => {
    // A requester cannot act as their own validator — passing their own id as validatorId must be blocked.
    const requester = await createRequester();
    const req = await vacationService.submit(requester.id, '2025-12-01', '2025-12-05', null);

    await expect(vacationService.reject(req!.id, requester.id, 'Not valid'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when the request is already rejected', async () => {
    // Once a request has been rejected, its status is no longer Pending.
    // Trying to reject it again must be blocked — only Pending requests can be acted upon.
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-01-01', '2026-01-05', null);
    await vacationService.reject(req!.id, validator.id, 'First rejection');

    await expect(vacationService.reject(req!.id, validator.id, 'Second rejection'))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
