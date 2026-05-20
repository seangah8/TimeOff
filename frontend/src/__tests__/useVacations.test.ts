import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import api from '@/api';
import { useRequesterVacations, useValidatorVacations } from '@/composables/useVacations';

vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const fakeRequest = {
  id: 1,
  status: 'Pending',
  startDate: '2024-03-01',
  endDate: '2024-03-05',
  reason: 'Holiday',
  requester: { id: 1, name: 'Alice', role: 'Requester' },
  validator: null,
  comment: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('useRequesterVacations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchRequests calls GET /vacations/me and stores the result', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { requests, fetchRequests } = useRequesterVacations();
    await fetchRequests();

    expect(api.get).toHaveBeenCalledWith('/vacations/me');
    expect(requests.value).toEqual([fakeRequest]);
  });

  it('loading is true during the request and false once settled', async () => {
    let resolve!: (v: unknown) => void;
    vi.mocked(api.get).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { loading, fetchRequests } = useRequesterVacations();
    const promise = fetchRequests();

    expect(loading.value).toBe(true);
    resolve({ data: { success: true, data: [] } });
    await promise;
    expect(loading.value).toBe(false);
  });

  it('fetchRequests resets loading to false when the API throws', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    const { loading, fetchRequests } = useRequesterVacations();
    await expect(fetchRequests()).rejects.toThrow('Network error');

    expect(loading.value).toBe(false);
  });

  it('submitRequest sends POST /vacations with the exact payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: fakeRequest } });

    const { submitRequest } = useRequesterVacations();
    const payload = { startDate: '2024-03-01', endDate: '2024-03-05', reason: 'Holiday' };
    await submitRequest(payload);

    expect(api.post).toHaveBeenCalledWith('/vacations', payload);
  });

  it('deleteRequest sends DELETE /vacations/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: null } });

    const { deleteRequest } = useRequesterVacations();
    await deleteRequest(15);

    expect(api.delete).toHaveBeenCalledWith('/vacations/15');
  });

  it('submitRequest propagates API errors to the caller', async () => {
    const apiError = { response: { status: 409, data: { success: false, error: 'Overlapping request' } } };
    vi.mocked(api.post).mockRejectedValueOnce(apiError);

    const { submitRequest } = useRequesterVacations();
    await expect(submitRequest({ startDate: '2024-03-01', endDate: '2024-03-05', reason: '' })).rejects.toEqual(apiError);
  });
});

describe('useValidatorVacations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchRequests with no filter sends empty params to GET /vacations', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { requests, fetchRequests } = useValidatorVacations();
    await fetchRequests();

    expect(api.get).toHaveBeenCalledWith('/vacations', { params: {} });
    expect(requests.value).toEqual([fakeRequest]);
  });

  it('fetchRequests with a status sends the correct query param', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { fetchRequests } = useValidatorVacations();
    await fetchRequests('Pending');

    expect(api.get).toHaveBeenCalledWith('/vacations', { params: { status: 'Pending' } });
  });

  it('fetchRequests accepts Approved and Rejected as valid filters', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });

    const { fetchRequests } = useValidatorVacations();
    await fetchRequests('Approved');
    await fetchRequests('Rejected');

    expect(api.get).toHaveBeenNthCalledWith(1, '/vacations', { params: { status: 'Approved' } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/vacations', { params: { status: 'Rejected' } });
  });

  it('fetchRequests resets loading to false when the API throws', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Server error'));

    const { loading, fetchRequests } = useValidatorVacations();
    await expect(fetchRequests()).rejects.toThrow('Server error');

    expect(loading.value).toBe(false);
  });

  it('approveRequest sends PATCH /vacations/:id/approve with no body', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { success: true, data: {} } });

    const { approveRequest } = useValidatorVacations();
    await approveRequest(42);

    expect(api.patch).toHaveBeenCalledWith('/vacations/42/approve');
    expect(api.patch).toHaveBeenCalledTimes(1);
  });

  it('rejectRequest sends PATCH /vacations/:id/reject with the comment', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { success: true, data: {} } });

    const { rejectRequest } = useValidatorVacations();
    await rejectRequest(7, 'Too many days');

    expect(api.patch).toHaveBeenCalledWith('/vacations/7/reject', { comment: 'Too many days' });
  });

  it('rejectRequest uses the exact request id in the URL', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: {} } });

    const { rejectRequest } = useValidatorVacations();
    await rejectRequest(99, 'Not approved');

    expect(api.patch).toHaveBeenCalledWith('/vacations/99/reject', { comment: 'Not approved' });
  });
});
