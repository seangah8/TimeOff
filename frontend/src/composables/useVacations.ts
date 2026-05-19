import { ref } from 'vue';
import api from '@/api';
import type { VacationRequest } from '@/types';

export function useRequesterVacations() {
  const requests = ref<VacationRequest[]>([]);
  const loading = ref(false);

  async function fetchRequests(): Promise<void> {
    loading.value = true;
    try {
      const res = await api.get<{ success: true; data: VacationRequest[] }>('/vacations/me');
      requests.value = res.data.data;
    } finally {
      loading.value = false;
    }
  }

  async function submitRequest(payload: {
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<void> {
    await api.post('/vacations', payload);
  }

  return { requests, loading, fetchRequests, submitRequest };
}
