// Unit tests for the Axios response interceptor defined in src/api/index.ts.
// The interceptor's job is to redirect to /login and clear the user on 401 responses,
// and to leave all other responses (success or non-401 errors) completely untouched.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';

// vi.mock factories are hoisted before any imports, so vi.hoisted() is needed to
// create values that are referenced inside those factories.
const { mockRouterPush, mockClearUser } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockClearUser: vi.fn(),
}));

// Mock the router so router.push() does not trigger real navigation.
vi.mock('@/router', () => ({
  default: { push: mockRouterPush },
}));

// Mock the auth store — vi.mock intercepts both static and dynamic imports, so the
// dynamic import('@/stores/auth') inside the interceptor receives this mock too.
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({ clearUser: mockClearUser })),
}));

// Import the api instance AFTER mocks are registered so the interceptor it sets up
// uses the mocked router and store, not the real ones.
import api from '@/api';

// Reach into Axios internals to extract the interceptor handlers registered by api/index.ts.
// handlers[0] is the first (and only) interceptor registered in our file.
// fulfilled = the success handler (passes responses through unchanged).
// rejected = the error handler (where the 401 logic lives).
const { fulfilled: passThrough, rejected: onError } = (
  api.interceptors.response as any
).handlers[0];

describe('api response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 401 Unauthorized -------------------------------------------------------

  describe('on 401 Unauthorized', () => {
    it('redirects the user to /login', async () => {
      const err = { response: { status: 401 } };
      // The interceptor must still reject the promise so callers know the request failed.
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('clears the stored auth user', async () => {
      const err = { response: { status: 401 } };
      await expect(onError(err)).rejects.toEqual(err);
      // clearUser is called inside a dynamic import .then() which is a microtask.
      // flushPromises() drains the microtask queue so the assertion sees the result.
      await flushPromises();
      expect(mockClearUser).toHaveBeenCalled();
    });

    it('still rejects so callers can handle the error themselves', async () => {
      // The interceptor must not swallow the error — it re-rejects after side effects.
      const err = { response: { status: 401 } };
      await expect(onError(err)).rejects.toEqual(err);
    });
  });

  // --- Non-401 errors ---------------------------------------------------------

  describe('on non-401 errors', () => {
    it('does not redirect for 403 Forbidden', async () => {
      // 403 means authenticated but not authorized — the user session is still valid,
      // so we must NOT log them out or redirect to /login.
      const err = { response: { status: 403 } };
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not redirect for 409 Conflict', async () => {
      const err = { response: { status: 409 } };
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not redirect for 422 Unprocessable Entity', async () => {
      const err = { response: { status: 422 } };
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not redirect for 500 Internal Server Error', async () => {
      const err = { response: { status: 500 } };
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not redirect when there is no response (network failure)', async () => {
      // A network error has no .response property — the interceptor must handle this gracefully.
      const err = { message: 'Network Error' };
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not clear the auth user for non-401 errors', async () => {
      const err = { response: { status: 403 } };
      await expect(onError(err)).rejects.toEqual(err);
      await flushPromises();
      expect(mockClearUser).not.toHaveBeenCalled();
    });
  });

  // --- Successful responses ---------------------------------------------------

  describe('on successful responses', () => {
    it('passes the response object through unchanged', () => {
      // The fulfilled handler is a simple identity function — returns whatever it receives.
      const res = { data: { success: true, data: { id: 1 } }, status: 200 };
      expect(passThrough(res)).toBe(res);
    });
  });
});
