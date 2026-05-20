import { describe, it, expect } from 'vitest';
import * as authService from '../api/services/authService';
import * as vacationService from '../api/services/vacationService';
import { UserRole } from '../entities/User';
import { VacationStatus } from '../entities/VacationRequest';

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

    expect(result!.status).toBe(VacationStatus.Approved);
    expect(result!.validator!.id).toBe(validator.id);
  });

  it('throws 404 when the request does not exist', async () => {
    const validator = await createValidator();

    await expect(vacationService.approve(99999, validator.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the requester tries to approve their own request', async () => {
    const requester = await createRequester();
    const req = await vacationService.submit(requester.id, '2025-09-01', '2025-09-05', null);

    await expect(vacationService.approve(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when the request is already approved', async () => {
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

    await expect(vacationService.approve(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when the request does not exist', async () => {
    const requester = await createRequester();

    await expect(vacationService.deleteRequest(99999, requester.id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the requester tries to delete someone else\'s request', async () => {
    const requester = await createRequester('Requester A');
    const other = await createRequester('Requester B');
    const req = await vacationService.submit(requester.id, '2026-03-01', '2026-03-05', null);

    await expect(vacationService.deleteRequest(req!.id, other.id))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when trying to delete an approved request', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-04-01', '2026-04-05', null);
    await vacationService.approve(req!.id, validator.id);

    await expect(vacationService.deleteRequest(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when trying to delete a rejected request', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-05-01', '2026-05-05', null);
    await vacationService.reject(req!.id, validator.id, 'Not approved');

    await expect(vacationService.deleteRequest(req!.id, requester.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('vacationService.reject', () => {
  it('rejects a pending request with a comment', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2025-11-01', '2025-11-05', null);

    const result = await vacationService.reject(req!.id, validator.id, 'Team is too busy');

    expect(result!.status).toBe(VacationStatus.Rejected);
    expect(result!.comment).toBe('Team is too busy');
    expect(result!.validator!.id).toBe(validator.id);
  });

  it('throws 403 when the requester tries to reject their own request', async () => {
    const requester = await createRequester();
    const req = await vacationService.submit(requester.id, '2025-12-01', '2025-12-05', null);

    await expect(vacationService.reject(req!.id, requester.id, 'Not valid'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 409 when the request is already rejected', async () => {
    const requester = await createRequester();
    const validator = await createValidator();
    const req = await vacationService.submit(requester.id, '2026-01-01', '2026-01-05', null);
    await vacationService.reject(req!.id, validator.id, 'First rejection');

    await expect(vacationService.reject(req!.id, validator.id, 'Second rejection'))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
