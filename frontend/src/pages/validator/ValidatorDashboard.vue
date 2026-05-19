<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import axios from 'axios';
import { useValidatorVacations } from '@/composables/useVacations';
import VacationStatusBadge from '@/components/vacation/VacationStatusBadge.vue';
import RejectDialog from '@/components/vacation/RejectDialog.vue';
import type { ApiError, VacationRequest } from '@/types';

const toast = useToast();
const { requests, loading, fetchRequests, approveRequest, rejectRequest } =
  useValidatorVacations();

const expandedRows = ref<Record<number, boolean>>({});
const selectedStatus = ref('Pending');
const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

const showRejectDialog = ref(false);
const rejectTarget = ref<VacationRequest | null>(null);
const actionLoading = ref(false);

onMounted(() => fetchRequests('Pending'));

watch(selectedStatus, (status) => {
  expandedRows.value = {};
  fetchRequests(status === 'All' ? undefined : status);
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpanded(id: number): boolean {
  return !!expandedRows.value[id];
}

function rowClass(data: VacationRequest): string {
  return expandedRows.value[data.id] ? 'expanded-row' : '';
}

function onRowClick(event: { data: VacationRequest }) {
  const id = event.data.id;
  const rows = { ...expandedRows.value };
  if (rows[id]) {
    delete rows[id];
  } else {
    rows[id] = true;
  }
  expandedRows.value = rows;
}

function getErrorMessage(e: unknown): string {
  return axios.isAxiosError(e) && e.response
    ? (e.response.data as ApiError).error
    : 'Something went wrong';
}

function refreshCurrent(): Promise<void> {
  return fetchRequests(selectedStatus.value === 'All' ? undefined : selectedStatus.value);
}

async function handleApprove(id: number) {
  actionLoading.value = true;
  try {
    await approveRequest(id);
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
        v-model:expandedRows="expandedRows"
        :value="requests"
        :loading="loading"
        :row-class="rowClass"
        data-key="id"
        striped-rows
        scrollable
        scroll-height="calc(100vh - 280px)"
        empty-message="No requests found."
        @row-click="onRowClick"
      >
        <Column style="width: 3rem">
          <template #body="{ data }">
            <i
              class="pi pi-chevron-right expand-chevron"
              :class="{ 'is-expanded': isExpanded(data.id) }"
            />
          </template>
        </Column>
        <Column field="createdAt" header="Submitted">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
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
                :disabled="actionLoading"
                @click.stop="handleApprove(data.id)"
              />
              <Button
                label="Reject"
                severity="danger"
                size="small"
                :disabled="actionLoading"
                @click.stop="openRejectDialog(data)"
              />
            </div>
          </template>
        </Column>

        <template #expansion="{ data }">
          <div class="expansion-panel">
            <div class="expansion-field">
              <span class="expansion-label">Reason</span>
              <span class="expansion-value">{{ data.reason || 'No reason provided' }}</span>
            </div>
            <div v-if="data.status === 'Rejected' && data.comment" class="expansion-field">
              <span class="expansion-label">Rejection comment</span>
              <span class="expansion-value expansion-comment">{{ data.comment }}</span>
            </div>
            <div v-if="data.validator" class="expansion-field">
              <span class="expansion-label">{{ data.status === 'Approved' ? 'Approved by' : 'Rejected by' }}</span>
              <span class="expansion-value">{{ data.validator.name }}</span>
            </div>
          </div>
        </template>
      </DataTable>
    </div>

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

.expand-chevron {
  font-size: 0.75rem;
  color: #bbb;
  transition: transform 0.18s ease, color 0.18s ease;
}

.expand-chevron.is-expanded {
  transform: rotate(90deg);
  color: #1ab394;
}

:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr:not(.expanded-row):hover > td) {
  background-color: rgba(0, 0, 0, 0.03) !important;
}

:deep(.p-datatable-tbody > tr.expanded-row > td) {
  background-color: rgba(26, 179, 148, 0.05) !important;
}

:deep(.p-datatable-tbody > tr.expanded-row > td:first-child) {
  box-shadow: inset 3px 0 0 #1ab394;
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expansion-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f0fdf9;
  animation: expandIn 0.15s ease-out;
}

.expansion-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.expansion-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
}

.expansion-value {
  font-size: 0.875rem;
  color: #333;
  white-space: pre-wrap;
}

.expansion-comment {
  color: #c0392b;
}
</style>
