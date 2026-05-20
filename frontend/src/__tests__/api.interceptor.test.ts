import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';

// vi.mock factories are hoisted to the top of the file before any const/let
// declarations are initialized. vi.hoisted() runs its callback at hoist-time,
// making the returned values available inside the mock factories below.
const { mockRouterPush, mockClearUser } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockClearUser: vi.fn(),
}));

vi.mock('@/router', () => ({
  default: { push: mockRouterPush },
}));

// vi.mock intercepts both static and dynamic imports, so the dynamic
// import('@/stores/auth') inside the interceptor gets this mock too.
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({ clearUser: mockClearUser })),
}));

import api from '@/api';

// Reach into axios internals to extract the handlers registered by our
// single interceptor. handlers[0] is the one registered in api/index.ts.
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
      await expect(onError(err)).rejects.toEqual(err);
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('clears the stored auth user', async () => {
      const err = { response: { status: 401 } };
      await expect(onError(err)).rejects.toEqual(err);
      // clearUser is called inside a dynamic-import .then(), so flush
      // the microtask queue before asserting.
      await flushPromises();
      expect(mockClearUser).toHaveBeenCalled();
    });

    it('still rejects so callers can handle the error themselves', async () => {
      const err = { response: { status: 401 } };
      await expect(onError(err)).rejects.toEqual(err);
    });
  });

  // --- Non-401 errors ---------------------------------------------------------

  describe('on non-401 errors', () => {
    it('does not redirect for 403 Forbidden', async () => {
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
      const err = { message: 'Network Error' }; // no .response property
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
      const res = { data: { success: true, data: { id: 1 } }, status: 200 };
      expect(passThrough(res)).toBe(res);
    });
  });
});
