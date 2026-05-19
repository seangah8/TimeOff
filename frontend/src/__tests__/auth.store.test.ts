import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';
import type { User } from '@/types';

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('login sets user from API response', async () => {
    const fakeUser: User = { id: 1, name: 'Alice', role: 'Requester' };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: fakeUser } });

    const store = useAuthStore();
    await store.login('Alice');

    expect(store.user).toEqual(fakeUser);
  });

  it('logout clears user', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    const store = useAuthStore();
    store.user = { id: 1, name: 'Alice', role: 'Requester' };

    await store.logout();

    expect(store.user).toBeNull();
  });

  it('fetchMe on error clears user', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthorized'));
    const store = useAuthStore();
    store.user = { id: 1, name: 'Alice', role: 'Requester' };

    await store.fetchMe();

    expect(store.user).toBeNull();
  });
});
