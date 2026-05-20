<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import axios from 'axios';
import { useValidatorVacations } from '@/composables/useVacations';
import VacationStatusBadge from '@/components/vacation/VacationStatusBadge.vue';
import RejectDialog from '@/components/vacation/RejectDialog.vue';
import ApproveDialog from '@/components/vacation/ApproveDialog.vue';
import RequestDetailDialog from '@/components/vacation/RequestDetailDialog.vue';
import type { ApiError, VacationRequest } from '@/types';
import socket from '@/socket';

const toast = useToast();
const { requests, loading, fetchRequests, approveRequest, rejectRequest } =
  useValidatorVacations();

const selectedStatus = ref('Pending');
const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

const showDetail = ref(false);
const detailTarget = ref<VacationRequest | null>(null);

const showApproveDialog = ref(false);
const approveTarget = ref<VacationRequest | null>(null);

const showRejectDialog = ref(false);
const rejectTarget = ref<VacationRequest | null>(null);
const actionLoading = ref(false);

onMounted(() => {
  fetchRequests('Pending');
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
});

watch(selectedStatus, (status) => {
  fetchRequests(status === 'All' ? undefined : status);
});

function formatDate(dateStr: string): string {
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

function refreshCurrent(): Promise<void> {
  return fetchRequests(selectedStatus.value === 'All' ? undefined : selectedStatus.value);
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
      <SelectButton
        v-model="selectedStatus"
        :options="statusOptions"
        :allow-empty="false"
      />
    </div>

    <div class="list-card">
      <DataTable
        :value="requests"
        :loading="loading"
        data-key="id"
        striped-rows
        scrollable
        scroll-height="calc(100vh - 280px)"
        empty-message="No requests found."
        @row-click="onRowClick"
      >
        <Column field="updatedAt" header="Last Updated">
          <template #body="{ data }">{{ formatDate(data.updatedAt) }}</template>
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
