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

  async function deleteRequest(id: number): Promise<void> {
    await api.delete(`/vacations/${id}`);
  }

  return { requests, loading, fetchRequests, submitRequest, deleteRequest };
}

export function useValidatorVacations() {
  const requests = ref<VacationRequest[]>([]);
  const loading = ref(false);

  async function fetchRequests(status?: string): Promise<void> {
    loading.value = true;
    try {
      const params = status ? { status } : {};
      const res = await api.get<{ success: true; data: VacationRequest[] }>('/vacations', {
        params,
      });
      requests.value = res.data.data;
    } finally {
      loading.value = false;
    }
  }

  async function approveRequest(id: number): Promise<void> {
    await api.patch(`/vacations/${id}/approve`);
  }

  async function rejectRequest(id: number, comment: string): Promise<void> {
    await api.patch(`/vacations/${id}/reject`, { comment });
  }

  return { requests, loading, fetchRequests, approveRequest, rejectRequest };
}
