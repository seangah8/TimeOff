<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import VacationStatusBadge from './VacationStatusBadge.vue';
import type { VacationRequest } from '@/types';

defineProps<{ requests: VacationRequest[]; loading: boolean }>();

const expandedRows = ref<Record<number, boolean>>({});

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
</script>

<template>
  <div class="list-card">
    <h2 class="list-title">My Requests</h2>
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="requests"
      :loading="loading"
      :row-class="rowClass"
      data-key="id"
      striped-rows
      scrollable
      scroll-height="calc(100vh - 280px)"
      empty-message="No vacation requests yet."
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
        </div>
      </template>
    </DataTable>
  </div>
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

.reason-text {
  max-width: 200px;
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
