// Unit tests for the Vue Router navigation guard.
// The auth store is mocked so no real API calls are made and we can control
// exactly what user the guard sees on each navigation attempt.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@/types';

// vi.mock factories are hoisted to the top of the file before any const/let
// declarations are initialized. vi.hoisted() runs its callback at hoist-time,
// making the returned values available inside the mock factories below.
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

// The router must be imported AFTER the mock is set up so its beforeEach guard
// captures our mocked useAuthStore rather than the real one.
import router from '@/router';
import { useAuthStore } from '@/stores/auth';

// Helper: tells the guard what it should see as the currently logged-in user.
// fetchMe is mocked as a no-op so it doesn't change the user we set here.
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

// Note: the router module keeps a module-scoped `initialized` flag so fetchMe
// is only called once per module lifetime (the very first navigation).
// After that the guard trusts the current user value from the mock,
// which is exactly what asUser() sets before each test.

describe('router navigation guards', () => {
  beforeEach(() => {
    // Default to no logged-in user so each test starts from a safe baseline.
    asUser(null);
  });

  // --- Unauthenticated --------------------------------------------------------

  describe('unauthenticated user', () => {
    it('is redirected to /login when visiting /requester', async () => {
      asUser(null);
      await router.push('/requester');
      // Protected route — must redirect to login.
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
      // Public route — must be accessible without authentication.
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
      // Own dashboard — must be accessible.
      expect(router.currentRoute.value.path).toBe('/requester');
    });

    it('is blocked from /validator and lands on /403', async () => {
      asUser(requester);
      await router.push('/validator');
      // Wrong role — must be redirected to the forbidden page, not login.
      expect(router.currentRoute.value.path).toBe('/403');
    });

    it('is auto-redirected from / to /requester', async () => {
      asUser(requester);
      await router.push('/');
      // A logged-in user visiting the root is sent straight to their dashboard.
      expect(router.currentRoute.value.path).toBe('/requester');
    });

    it('is auto-redirected from /login to /requester', async () => {
      asUser(requester);
      await router.push('/login');
      // Already logged in — no reason to show the login page again.
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
