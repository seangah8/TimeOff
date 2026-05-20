// Unit tests for the useRequesterVacations and useValidatorVacations composables.
// The Axios instance is fully mocked — no real HTTP requests are made.
// Tests verify that each function calls the correct endpoint with the correct params.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import api from '@/api';
import { useRequesterVacations, useValidatorVacations } from '@/composables/useVacations';

// Replace all Axios methods with mocks so we can control what the API returns.
vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// A minimal vacation request object used as a stand-in API response across all tests.
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

// --- useRequesterVacations --------------------------------------------------

describe('useRequesterVacations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchRequests calls GET /vacations/me and stores the result', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { requests, fetchRequests } = useRequesterVacations();
    await fetchRequests();

    // Must call the requester-only endpoint and store the returned array.
    expect(api.get).toHaveBeenCalledWith('/vacations/me');
    expect(requests.value).toEqual([fakeRequest]);
  });

  it('loading is true during the request and false once settled', async () => {
    // Use a manually controlled Promise so we can inspect the loading flag mid-flight.
    let resolve!: (v: unknown) => void;
    vi.mocked(api.get).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { loading, fetchRequests } = useRequesterVacations();
    const promise = fetchRequests();

    // While the promise is pending, loading must be true.
    expect(loading.value).toBe(true);
    resolve({ data: { success: true, data: [] } });
    await promise;
    // After the promise settles, loading must be false.
    expect(loading.value).toBe(false);
  });

  it('fetchRequests resets loading to false when the API throws', async () => {
    // Even on error, the finally block must clear the loading flag.
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

    // The id must be interpolated into the URL path.
    expect(api.delete).toHaveBeenCalledWith('/vacations/15');
  });

  it('submitRequest propagates API errors to the caller', async () => {
    // The composable must not swallow errors — let the page component handle them.
    const apiError = { response: { status: 409, data: { success: false, error: 'Overlapping request' } } };
    vi.mocked(api.post).mockRejectedValueOnce(apiError);

    const { submitRequest } = useRequesterVacations();
    await expect(submitRequest({ startDate: '2024-03-01', endDate: '2024-03-05', reason: '' })).rejects.toEqual(apiError);
  });
});

// --- useValidatorVacations --------------------------------------------------

describe('useValidatorVacations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchRequests with no filter sends limit and offset to GET /vacations', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { requests, fetchRequests } = useValidatorVacations();
    await fetchRequests();

    // Pagination params must always be included even when there is no status or name filter.
    expect(api.get).toHaveBeenCalledWith('/vacations', { params: { limit: 50, offset: 0 } });
    expect(requests.value).toEqual([fakeRequest]);
  });

  it('fetchRequests with a status includes status, limit and offset', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { fetchRequests } = useValidatorVacations();
    await fetchRequests('Pending');

    expect(api.get).toHaveBeenCalledWith('/vacations', { params: { status: 'Pending', limit: 50, offset: 0 } });
  });

  it('fetchRequests accepts Approved and Rejected as valid filters', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });

    const { fetchRequests } = useValidatorVacations();
    await fetchRequests('Approved');
    await fetchRequests('Rejected');

    expect(api.get).toHaveBeenNthCalledWith(1, '/vacations', { params: { status: 'Approved', limit: 50, offset: 0 } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/vacations', { params: { status: 'Rejected', limit: 50, offset: 0 } });
  });

  it('hasMore is false when the API returns fewer rows than PAGE_SIZE', async () => {
    // PAGE_SIZE is 50. One row returned means there are no more pages.
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { hasMore, fetchRequests } = useValidatorVacations();
    await fetchRequests();

    expect(hasMore.value).toBe(false);
  });

  it('fetchMore appends rows and advances the offset', async () => {
    // First page: 50 rows (full page → hasMore stays true).
    // Second page (fetchMore): 1 row appended to the existing 50.
    const firstPage = Array.from({ length: 50 }, (_, i) => ({ ...fakeRequest, id: i + 1 }));
    const secondPage = [{ ...fakeRequest, id: 51 }];
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: firstPage } })
      .mockResolvedValueOnce({ data: { success: true, data: secondPage } });

    const { requests, fetchRequests, fetchMore } = useValidatorVacations();
    await fetchRequests('Pending');
    await fetchMore();

    // Total must be 51 and the second call must use offset=50.
    expect(requests.value).toHaveLength(51);
    expect(api.get).toHaveBeenNthCalledWith(2, '/vacations', { params: { status: 'Pending', limit: 50, offset: 50 } });
  });

  it('fetchMore sets hasMore to false when the last page is partial', async () => {
    // A partial second page means we have reached the end of the result set.
    const fullPage = Array.from({ length: 50 }, (_, i) => ({ ...fakeRequest, id: i + 1 }));
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: fullPage } })
      .mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { hasMore, fetchRequests, fetchMore } = useValidatorVacations();
    await fetchRequests();
    await fetchMore();

    expect(hasMore.value).toBe(false);
  });

  it('fetchMore does nothing when hasMore is false', async () => {
    // One row returned → hasMore becomes false → a subsequent fetchMore must be a no-op.
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { fetchRequests, fetchMore } = useValidatorVacations();
    await fetchRequests();
    await fetchMore();

    // Only one GET call should have been made (the initial fetchRequests).
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('fetchRequests with a name filter includes name, limit and offset', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { fetchRequests } = useValidatorVacations();
    await fetchRequests(undefined, 'Alice');

    expect(api.get).toHaveBeenCalledWith('/vacations', { params: { name: 'Alice', limit: 50, offset: 0 } });
  });

  it('fetchMore carries the name filter from the last fetchRequests call', async () => {
    // The internal currentName variable must be remembered between calls.
    const fullPage = Array.from({ length: 50 }, (_, i) => ({ ...fakeRequest, id: i + 1 }));
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: fullPage } })
      .mockResolvedValueOnce({ data: { success: true, data: [fakeRequest] } });

    const { fetchRequests, fetchMore } = useValidatorVacations();
    await fetchRequests('Pending', 'Alice');
    await fetchMore();

    expect(api.get).toHaveBeenNthCalledWith(2, '/vacations', { params: { status: 'Pending', name: 'Alice', limit: 50, offset: 50 } });
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

    // The comment must be sent in the request body.
    expect(api.patch).toHaveBeenCalledWith('/vacations/7/reject', { comment: 'Too many days' });
  });

  it('rejectRequest uses the exact request id in the URL', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: {} } });

    const { rejectRequest } = useValidatorVacations();
    await rejectRequest(99, 'Not approved');

    expect(api.patch).toHaveBeenCalledWith('/vacations/99/reject', { comment: 'Not approved' });
  });
});
