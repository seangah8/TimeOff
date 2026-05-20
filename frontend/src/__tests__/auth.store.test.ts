// Unit tests for the Pinia auth store.
// The Axios instance is fully mocked so no real HTTP requests are made.
// A fresh Pinia instance is created before each test so store state never leaks between tests.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';
import type { User } from '@/types';

// Replace the real Axios instance with a mock that has controllable return values.
vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Create a new isolated Pinia before every test so that state from one test
    // does not affect the next (e.g. a logged-in user left over from a previous test).
    setActivePinia(createPinia());
    vi.clearAllMocks(); // reset call counts and return values on every mock
  });

  it('login sets user from API response', async () => {
    // Arrange: make the mocked POST return a user payload.
    const fakeUser: User = { id: 1, name: 'Alice', role: 'Requester' };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: fakeUser } });

    // Act: call login on the store.
    const store = useAuthStore();
    await store.login('Alice');

    // Assert: the store's user ref should now hold the returned user.
    expect(store.user).toEqual(fakeUser);
  });

  it('logout clears user', async () => {
    // Arrange: mock the logout POST to resolve with an empty response, and pre-set a user.
    vi.mocked(api.post).mockResolvedValueOnce({});
    const store = useAuthStore();
    store.user = { id: 1, name: 'Alice', role: 'Requester' };

    // Act: call logout.
    await store.logout();

    // Assert: user should be null after logout regardless of what it was before.
    expect(store.user).toBeNull();
  });

  it('fetchMe on error clears user', async () => {
    // Arrange: make the GET /auth/me call throw (simulates an expired/invalid cookie).
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthorized'));
    const store = useAuthStore();
    // Start with a stale user value as if it was set from a previous session.
    store.user = { id: 1, name: 'Alice', role: 'Requester' };

    // Act: fetchMe swallows the error and clears the user instead of throwing.
    await store.fetchMe();

    // Assert: user must be null — the session was invalid.
    expect(store.user).toBeNull();
  });
});
