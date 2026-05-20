import { ref } from 'vue';
import api from '@/api';
import type { VacationRequest } from '@/types';

// Composable for the Requester dashboard — fetches and manages the current user's own requests.
export function useRequesterVacations() {
  const requests = ref<VacationRequest[]>([]);
  const loading = ref(false);

  async function fetchRequests(): Promise<void> {
    loading.value = true;
    try {
      const res = await api.get<{ success: true; data: VacationRequest[] }>('/vacations/me');
      requests.value = res.data.data;
    } finally {
      // finally ensures loading resets even if the request throws.
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

// Number of records fetched per page. Kept in sync with the backend's default limit.
const PAGE_SIZE = 50;

// Composable for the Validator dashboard — fetches all requests with filtering and infinite scroll.
export function useValidatorVacations() {
  const requests = ref<VacationRequest[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false); // true only during a "load next page" call, not the initial load
  const hasMore = ref(true);      // false when the last page returned fewer rows than PAGE_SIZE

  // These three variables are NOT reactive — they are internal state used to build
  // the correct query params for fetchMore(). Making them refs would cause unnecessary re-renders.
  let currentStatus: string | undefined;
  let currentName: string | undefined;
  let currentOffset = 0;

  // Fetches the first page with the given filters and resets all pagination state.
  // Called whenever the status filter or search term changes.
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
      // If the server returned a full page, there might be more — otherwise we've reached the end.
      hasMore.value = res.data.data.length === PAGE_SIZE;
      currentOffset = res.data.data.length;
    } finally {
      loading.value = false;
    }
  }

  // Fetches the next page using the same filters as the last fetchRequests() call
  // and appends the results to the existing list (infinite scroll behaviour).
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
