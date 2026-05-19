import { describe, it, expect } from 'vitest';
import * as authService from '../api/services/authService';
import { UserRole } from '../entities/User';

describe('authService.register', () => {
  it('creates a user and returns a signed token', async () => {
    const { user, token } = await authService.register('Alice', UserRole.Requester);

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.role).toBe(UserRole.Requester);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('throws 409 when the name is already taken', async () => {
    await authService.register('Alice', UserRole.Requester);

    await expect(authService.register('Alice', UserRole.Validator))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('authService.login', () => {
  it('returns user and token when name exists', async () => {
    await authService.register('Bob', UserRole.Validator);
    const { user, token } = await authService.login('Bob');

    expect(user.name).toBe('Bob');
    expect(user.role).toBe(UserRole.Validator);
    expect(typeof token).toBe('string');
  });

  it('throws 404 when name is not found', async () => {
    await expect(authService.login('Unknown'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
