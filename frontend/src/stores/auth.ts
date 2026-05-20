import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, UserRole } from '@/types';
import api from '@/api';

export const useAuthStore = defineStore('auth', () => {
  // The currently logged-in user. Null means no active session.
  const user = ref<User | null>(null);

  async function login(name: string): Promise<void> {
    const res = await api.post<{ success: true; data: User }>('/auth/login', { name });
    user.value = res.data.data;
  }

  async function register(name: string, role: UserRole): Promise<void> {
    const res = await api.post<{ success: true; data: User }>('/auth/register', { name, role });
    user.value = res.data.data;
  }

  async function logout(): Promise<void> {
    await api.post('/auth/logout');
    user.value = null;
  }

  // Called once on the first page navigation to restore the session from the cookie.
  // Errors are swallowed silently — a failed fetch just means the user is not logged in.
  async function fetchMe(): Promise<void> {
    try {
      const res = await api.get<{ success: true; data: User }>('/auth/me');
      user.value = res.data.data;
    } catch {
      user.value = null;
    }
  }

  // Called by the Axios 401 interceptor to wipe the local state when the server
  // rejects the session — keeps the UI in sync without requiring a full page reload.
  function clearUser(): void {
    user.value = null;
  }

  return { user, login, register, logout, fetchMe, clearUser };
});
