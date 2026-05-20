import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@/types';

// Mock the auth store before the router is imported so the beforeEach guard
// receives our mock when it calls useAuthStore() during navigation.
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import router from '@/router';
import { useAuthStore } from '@/stores/auth';

// Helper: configure what the guard will see as the current user.
// The guard reads auth.user and calls auth.fetchMe() — fetchMe is a no-op
// here so it does not change the user we set.
function asUser(user: User | null) {
  vi.mocked(useAuthStore).mockReturnValue({
    user,
    fetchMe: vi.fn().mockResolvedValue(undefined),
    clearUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  } as any);
}

// Note: the router module keeps a module-scoped `initialized` flag so
// fetchMe is only called once per module lifetime (the first navigation).
// After that the guard trusts the current user value from the mock, which
// is exactly what we set in each test via asUser().

describe('router navigation guards', () => {
  beforeEach(() => {
    asUser(null); // safe default — no logged-in user
  });

  // --- Unauthenticated --------------------------------------------------------

  describe('unauthenticated user', () => {
    it('is redirected to /login when visiting /requester', async () => {
      asUser(null);
      await router.push('/requester');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('is redirected to /login when visiting /validator', async () => {
      asUser(null);
      await router.push('/validator');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('can access the /login page', async () => {
      asUser(null);
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('can access the /register page', async () => {
      asUser(null);
      await router.push('/register');
      expect(router.currentRoute.value.path).toBe('/register');
    });

    it('can access the /403 error page', async () => {
      asUser(null);
      await router.push('/403');
      expect(router.currentRoute.value.path).toBe('/403');
    });

    it('can access the /404 error page', async () => {
      asUser(null);
      await router.push('/404');
      expect(router.currentRoute.value.path).toBe('/404');
    });
  });

  // --- Requester --------------------------------------------------------------

  describe('authenticated Requester', () => {
    const requester: User = { id: 1, name: 'Alice', role: 'Requester' };

    it('can reach /requester', async () => {
      asUser(requester);
      await router.push('/requester');
      expect(router.currentRoute.value.path).toBe('/requester');
    });

    it('is blocked from /validator and lands on /403', async () => {
      asUser(requester);
      await router.push('/validator');
      expect(router.currentRoute.value.path).toBe('/403');
    });

    it('is auto-redirected from / to /requester', async () => {
      asUser(requester);
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/requester');
    });

    it('is auto-redirected from /login to /requester', async () => {
      asUser(requester);
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/requester');
    });

    it('is auto-redirected from /register to /requester', async () => {
      asUser(requester);
      await router.push('/register');
      expect(router.currentRoute.value.path).toBe('/requester');
    });
  });

  // --- Validator --------------------------------------------------------------

  describe('authenticated Validator', () => {
    const validator: User = { id: 2, name: 'Bob', role: 'Validator' };

    it('can reach /validator', async () => {
      asUser(validator);
      await router.push('/validator');
      expect(router.currentRoute.value.path).toBe('/validator');
    });

    it('is blocked from /requester and lands on /403', async () => {
      asUser(validator);
      await router.push('/requester');
      expect(router.currentRoute.value.path).toBe('/403');
    });

    it('is auto-redirected from / to /validator', async () => {
      asUser(validator);
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/validator');
    });

    it('is auto-redirected from /login to /validator', async () => {
      asUser(validator);
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/validator');
    });

    it('is auto-redirected from /register to /validator', async () => {
      asUser(validator);
      await router.push('/register');
      expect(router.currentRoute.value.path).toBe('/validator');
    });
  });
});
