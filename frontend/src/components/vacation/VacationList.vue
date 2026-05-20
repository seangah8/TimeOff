<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import VacationStatusBadge from './VacationStatusBadge.vue';
import RequestDetailDialog from './RequestDetailDialog.vue';
import type { VacationRequest } from '@/types';

defineProps<{ requests: VacationRequest[]; loading: boolean; allowDelete?: boolean }>();
const emit = defineEmits<{ 'delete-request': [id: number] }>();

const showDetail = ref(false);
const selectedRequest = ref<VacationRequest | null>(null);

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
  selectedRequest.value = event.data;
  showDetail.value = true;
}

function onDeleteConfirmed(id: number) {
  showDetail.value = false;
  emit('delete-request', id);
}
</script>

<template>
  <div class="list-card">
    <h2 class="list-title">My Requests</h2>
    <DataTable
      v-if="loading || requests.length > 0"
      :value="requests"
      :loading="loading"
      data-key="id"
      striped-rows
      scrollable
      scroll-height="calc(100vh - 280px)"
      @row-click="onRowClick"
    >
      <Column field="createdAt" header="Submitted">
        <template #body="{ data }">{{ formatTimestamp(data.createdAt) }}</template>
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
    </DataTable>

    <div v-else class="empty-state">
      <i class="pi pi-calendar-times empty-icon" />
      <p class="empty-title">No requests yet</p>
      <p class="empty-sub">Your submitted vacation requests will appear here.</p>
    </div>
  </div>

  <RequestDetailDialog
    v-model:visible="showDetail"
    :request="selectedRequest"
    :show-requester="false"
    :allow-delete="allowDelete"
    @confirmed-delete="onDeleteConfirmed"
  />
</template>

<style scoped>
.list-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.list-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.25rem;
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

.reason-text {
  max-width: 200px;
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
</style>
