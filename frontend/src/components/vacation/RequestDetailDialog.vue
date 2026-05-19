<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import VacationStatusBadge from './VacationStatusBadge.vue';
import type { VacationRequest } from '@/types';

withDefaults(defineProps<{
  visible: boolean;
  request: VacationRequest | null;
  showRequester?: boolean;
}>(), { showRequester: true });

const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Request Details"
    modal
    :style="{ width: '500px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="request" class="detail-body">
      <div class="top-grid">
        <div v-if="showRequester" class="detail-field">
          <span class="detail-label">Submitted by</span>
          <span class="detail-value">{{ request.requester.name }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Submitted time</span>
          <span class="detail-value">{{ formatDateTime(request.createdAt) }}</span>
        </div>
        <div v-if="request.validator" class="detail-field">
          <span class="detail-label">{{ request.status === 'Approved' ? 'Approved by' : 'Rejected by' }}</span>
          <span class="detail-value">{{ request.validator.name }}</span>
        </div>
        <div v-if="request.validator" class="detail-field">
          <span class="detail-label">{{ request.status === 'Approved' ? 'Approved time' : 'Rejected time' }}</span>
          <span class="detail-value">{{ formatDateTime(request.updatedAt) }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Period</span>
          <span class="detail-value">{{ formatDate(request.startDate) }} → {{ formatDate(request.endDate) }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Status</span>
          <span class="badge-wrap">
            <VacationStatusBadge :status="request.status" />
          </span>
        </div>
      </div>

      <div class="divider" />

      <div class="detail-field">
        <span class="detail-label">Reason</span>
        <span class="detail-value detail-reason">{{ request.reason || 'No reason provided' }}</span>
      </div>
      <div v-if="request.status === 'Rejected' && request.comment" class="detail-field">
        <span class="detail-label">Rejection comment</span>
        <span class="detail-value detail-comment">{{ request.comment }}</span>
      </div>
    </div>

    <template #footer>
      <Button label="Close" severity="secondary" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
</template>

<style scoped>
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-top: 0.25rem;
}

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.divider {
  border-top: 1px solid #f0f0f0;
  margin: 0.1rem 0;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
}

.detail-value {
  font-size: 0.875rem;
  color: #333;
}

.badge-wrap {
  align-self: flex-start;
}

.detail-reason {
  white-space: pre-wrap;
}

.detail-comment {
  white-space: pre-wrap;
  color: #c0392b;
}
</style>
