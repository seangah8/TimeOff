import { describe, it, expect } from 'vitest';
import * as authService from '../api/services/authService';
import { UserRole } from '../entities/User';

// Integration tests — run against a real test DB that is wiped before each test.

describe('authService.register', () => {
  it('creates a user and returns a signed token', async () => {
    const { user, token } = await authService.register('Alice', UserRole.Requester);

    expect(user.id).toBeDefined(); // DB assigned an auto-increment id
    expect(user.name).toBe('Alice');
    expect(user.role).toBe(UserRole.Requester);
    // A JWT is three Base64 segments separated by dots.
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('throws 409 when the name is already taken', async () => {
    // Register Alice once successfully, then attempt the same name again.
    // Names are unique system-wide — the second call must fail with 409 Conflict.
    await authService.register('Alice', UserRole.Requester);

    await expect(authService.register('Alice', UserRole.Validator))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('authService.login', () => {
  it('returns user and token when name exists', async () => {
    // Create the user first so the login has a record to find.
    await authService.register('Bob', UserRole.Validator);
    const { user, token } = await authService.login('Bob');

    expect(user.name).toBe('Bob');
    expect(user.role).toBe(UserRole.Validator);
    expect(typeof token).toBe('string');
  });

  it('throws 404 when name is not found', async () => {
    // No user with this name was registered — must throw 404 Not Found.
    await expect(authService.login('Unknown'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
