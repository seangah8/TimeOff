<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import type { VacationRequest } from '@/types';

defineProps<{ visible: boolean; loading: boolean; request: VacationRequest | null }>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirmed: [];
}>();

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function handleHide() {
  emit('update:visible', false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Approve Request"
    modal
    :style="{ width: '480px' }"
    @update:visible="handleHide"
  >
    <div v-if="request" class="approve-body">
      <div class="request-card">
        <p class="card-title">Request Details</p>
        <div class="detail-field">
          <span class="detail-label">Requester</span>
          <span class="detail-value">{{ request.requester.name }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Period</span>
          <span class="detail-value">{{ formatDate(request.startDate) }} → {{ formatDate(request.endDate) }}</span>
        </div>
        <div v-if="request.reason" class="detail-field">
          <span class="detail-label">Reason</span>
          <span class="detail-value detail-reason">{{ request.reason }}</span>
        </div>
      </div>

      <p class="confirm-text">Are you sure you want to approve this request?</p>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" text :disabled="loading" @click="handleHide" />
      <Button label="Approve" severity="success" :loading="loading" @click="emit('confirmed')" />
    </template>
  </Dialog>
</template>

<style scoped>
.approve-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.25rem;
}

.request-card {
  background: #f0fdf9;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.card-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1ab394;
  margin-bottom: 0.1rem;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #aaa;
}

.detail-value {
  font-size: 0.875rem;
  color: #333;
}

.detail-reason {
  white-space: pre-wrap;
}

.confirm-text {
  font-size: 0.9rem;
  color: #444;
}
</style>
