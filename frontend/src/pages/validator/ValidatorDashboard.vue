<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import InputText from 'primevue/inputtext';
import axios from 'axios';
import { useValidatorVacations } from '@/composables/useVacations';
import VacationStatusBadge from '@/components/vacation/VacationStatusBadge.vue';
import RejectDialog from '@/components/vacation/RejectDialog.vue';
import ApproveDialog from '@/components/vacation/ApproveDialog.vue';
import RequestDetailDialog from '@/components/vacation/RequestDetailDialog.vue';
import type { ApiError, VacationRequest } from '@/types';
import socket from '@/socket';

const toast = useToast();
const { requests, loading, loadingMore, hasMore, fetchRequests, fetchMore, approveRequest, rejectRequest } =
  useValidatorVacations();

const selectedStatus = ref('Pending');
const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

const searchName = ref('');
// Debounce timer — delays the API call until the user stops typing for 500ms.
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const showDetail = ref(false);
const detailTarget = ref<VacationRequest | null>(null);

const showApproveDialog = ref(false);
const approveTarget = ref<VacationRequest | null>(null);

const showRejectDialog = ref(false);
const rejectTarget = ref<VacationRequest | null>(null);
const actionLoading = ref(false);
const dataTableRef = ref();

// Triggers infinite scroll when the user is within 50 row-heights of the bottom.
// rowHeight is estimated from the total scroll height divided by the current row count.
function handleScroll(e: Event) {
  if (!hasMore.value || loadingMore.value) return;
  const el = e.target as HTMLElement;
  if (!requests.value.length) return;
  const rowHeight = el.scrollHeight / requests.value.length;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 50) {
    fetchMore();
  }
}

function getScrollEl(): HTMLElement | null {
  return dataTableRef.value?.$el?.querySelector('.p-datatable-table-container') ?? null;
}

onMounted(() => {
  fetchRequests('Pending');
  nextTick(() => getScrollEl()?.addEventListener('scroll', handleScroll));
  // Show a toast and refresh the table whenever a requester submits a new request.
  socket.on('vacation:new', (request: VacationRequest) => {
    toast.add({
      severity: 'info',
      summary: `New request from ${request.requester.name}`,
      detail: `${formatDate(request.startDate)} → ${formatDate(request.endDate)}`,
      life: 5000,
    });
    refreshCurrent();
  });
});

onUnmounted(() => {
  socket.off('vacation:new');
  getScrollEl()?.removeEventListener('scroll', handleScroll);
});

watch(selectedStatus, (status) => {
  fetchRequests(status === 'All' ? undefined : status, searchName.value.trim() || undefined);
});

watch(searchName, (val) => {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchRequests(selectedStatus.value === 'All' ? undefined : selectedStatus.value, val.trim() || undefined);
  }, 500);
});

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function onRowClick(event: { data: VacationRequest }) {
  detailTarget.value = event.data;
  showDetail.value = true;
}

function getErrorMessage(e: unknown): string {
  return axios.isAxiosError(e) && e.response
    ? (e.response.data as ApiError).error
    : 'Something went wrong';
}

const hasActiveFilter = computed(
  () => selectedStatus.value !== 'All' || searchName.value.trim() !== '',
);

function refreshCurrent(): Promise<void> {
  return fetchRequests(
    selectedStatus.value === 'All' ? undefined : selectedStatus.value,
    searchName.value.trim() || undefined,
  );
}

function openApproveDialog(data: VacationRequest) {
  approveTarget.value = data;
  showApproveDialog.value = true;
}

async function handleApproveConfirmed() {
  if (!approveTarget.value) return;
  actionLoading.value = true;
  try {
    await approveRequest(approveTarget.value.id);
    showApproveDialog.value = false;
    toast.add({ severity: 'success', summary: 'Request approved', life: 3000 });
    await refreshCurrent();
  } catch (e) {
    toast.add({ severity: 'error', summary: getErrorMessage(e), life: 4000 });
  } finally {
    actionLoading.value = false;
  }
}

function openRejectDialog(data: VacationRequest) {
  rejectTarget.value = data;
  showRejectDialog.value = true;
}

async function handleRejectConfirmed(comment: string) {
  if (!rejectTarget.value) return;
  actionLoading.value = true;
  try {
    await rejectRequest(rejectTarget.value.id, comment);
    showRejectDialog.value = false;
    toast.add({ severity: 'success', summary: 'Request rejected', life: 3000 });
    await refreshCurrent();
  } catch (e) {
    toast.add({ severity: 'error', summary: getErrorMessage(e), life: 4000 });
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">All Vacation Requests</h1>
      <div class="header-controls">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search" />
          <InputText v-model="searchName" placeholder="Search by name…" class="search-input" />
        </span>
        <SelectButton
          v-model="selectedStatus"
          :options="statusOptions"
          :allow-empty="false"
        />
      </div>
    </div>

    <div class="list-card">
      <DataTable
        v-if="loading || requests.length > 0"
        ref="dataTableRef"
        :value="requests"
        :loading="loading"
        data-key="id"
        striped-rows
        scrollable
        scroll-height="calc(100vh - 280px)"
        @row-click="onRowClick"
      >
        <Column field="updatedAt" header="Last Updated">
          <template #body="{ data }">{{ formatTimestamp(data.updatedAt) }}</template>
        </Column>
        <Column field="requester.name" header="Requester">
          <template #body="{ data }">{{ data.requester.name }}</template>
        </Column>
        <Column field="startDate" header="Start Date">
          <template #body="{ data }">{{ formatDate(data.startDate) }}</template>
        </Column>
        <Column field="endDate" header="End Date">
          <template #body="{ data }">{{ formatDate(data.endDate) }}</template>
        </Column>
        <Column field="reason" header="Reason">
          <template #body="{ data }">
            <span class="reason-text">{{ data.reason || '—' }}</span>
          </template>
        </Column>
        <Column field="status" header="Status">
          <template #body="{ data }">
            <VacationStatusBadge :status="data.status" />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <div v-if="data.status === 'Pending'" class="actions">
              <Button
                label="Approve"
                severity="success"
                size="small"
                class="approve-btn"
                :disabled="actionLoading"
                @click.stop="openApproveDialog(data)"
              />
              <Button
                label="Reject"
                severity="danger"
                size="small"
                class="reject-btn"
                :disabled="actionLoading"
                @click.stop="openRejectDialog(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-else class="empty-state">
        <i class="pi pi-inbox empty-icon" />
        <p class="empty-title">{{ hasActiveFilter ? 'No requests match your filters' : 'No requests yet' }}</p>
        <p class="empty-sub">{{ hasActiveFilter ? 'Try adjusting the status filter or search term.' : 'Vacation requests submitted by employees will appear here.' }}</p>
      </div>
    </div>

    <RequestDetailDialog
      v-model:visible="showDetail"
      :request="detailTarget"
    />

    <ApproveDialog
      v-model:visible="showApproveDialog"
      :loading="actionLoading"
      :request="approveTarget"
      @confirmed="handleApproveConfirmed"
    />

    <RejectDialog
      v-model:visible="showRejectDialog"
      :loading="actionLoading"
      :request="rejectTarget"
      @confirmed="handleRejectConfirmed"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-wrapper {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.search-wrapper .pi {
  position: absolute;
  left: 0.75rem;
  color: #888;
  z-index: 1;
  pointer-events: none;
}

.search-input {
  padding-left: 2.2rem !important;
  width: 200px;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
}

.list-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 0.4rem;
}

.empty-icon {
  font-size: 2.75rem;
  color: #d9d9d9;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #aaa;
  margin: 0;
}

.empty-sub {
  font-size: 0.85rem;
  color: #c0c0c0;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.reason-text {
  max-width: 180px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr:hover > td) {
  background-color: rgba(0, 0, 0, 0.03) !important;
}

:deep(.approve-btn.p-button) {
  background: #d6ebe5 !important;
  border-color: #d6ebe5 !important;
  color: #1a6b55 !important;
}
:deep(.approve-btn.p-button:hover) {
  background: #c2dfd7 !important;
  border-color: #c2dfd7 !important;
  color: #1a6b55 !important;
}

:deep(.reject-btn.p-button) {
  background: #f0dede !important;
  border-color: #f0dede !important;
  color: #8b3030 !important;
}
:deep(.reject-btn.p-button:hover) {
  background: #e5cccc !important;
  border-color: #e5cccc !important;
  color: #8b3030 !important;
}
</style>
