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

const PAGE_SIZE = 50;

export function useValidatorVacations() {
  const requests = ref<VacationRequest[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);

  // Non-reactive — only used internally to build the next request.
  let currentStatus: string | undefined;
  let currentName: string | undefined;
  let currentOffset = 0;

  async function fetchRequests(status?: string, name?: string): Promise<void> {
    currentStatus = status;
    currentName = name;
    currentOffset = 0;
    hasMore.value = true;
    loading.value = true;
    try {
      const params: Record<string, unknown> = { limit: PAGE_SIZE, offset: 0 };
      if (status) params.status = status;
      if (name) params.name = name;
      const res = await api.get<{ success: true; data: VacationRequest[] }>('/vacations', { params });
      requests.value = res.data.data;
      hasMore.value = res.data.data.length === PAGE_SIZE;
      currentOffset = res.data.data.length;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMore(): Promise<void> {
    if (!hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
    try {
      const params: Record<string, unknown> = { limit: PAGE_SIZE, offset: currentOffset };
      if (currentStatus) params.status = currentStatus;
      if (currentName) params.name = currentName;
      const res = await api.get<{ success: true; data: VacationRequest[] }>('/vacations', { params });
      requests.value = [...requests.value, ...res.data.data];
      hasMore.value = res.data.data.length === PAGE_SIZE;
      currentOffset += res.data.data.length;
    } finally {
      loadingMore.value = false;
    }
  }

  async function approveRequest(id: number): Promise<void> {
    await api.patch(`/vacations/${id}/approve`);
  }

  async function rejectRequest(id: number, comment: string): Promise<void> {
    await api.patch(`/vacations/${id}/reject`, { comment });
  }

  return { requests, loading, loadingMore, hasMore, fetchRequests, fetchMore, approveRequest, rejectRequest };
}
