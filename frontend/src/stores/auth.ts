import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, UserRole } from '@/types';
import api from '@/api';

export const useAuthStore = defineStore('auth', () => {
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

  async function fetchMe(): Promise<void> {
    try {
      const res = await api.get<{ success: true; data: User }>('/auth/me');
      user.value = res.data.data;
    } catch {
      user.value = null;
    }
  }

  function clearUser(): void {
    user.value = null;
  }

  return { user, login, register, logout, fetchMe, clearUser };
});
