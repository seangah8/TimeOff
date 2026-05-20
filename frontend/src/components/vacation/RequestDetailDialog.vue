<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import VacationStatusBadge from './VacationStatusBadge.vue';
import type { VacationRequest } from '@/types';

const props = withDefaults(defineProps<{
  visible: boolean;
  request: VacationRequest | null;
  showRequester?: boolean;
  allowDelete?: boolean;
}>(), { showRequester: true, allowDelete: false });

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'confirmed-delete': [id: number];
}>();

const confirmingDelete = ref(false);

watch(() => props.visible, (v) => {
  if (!v) confirmingDelete.value = false;
});

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
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
      <template v-if="allowDelete && request?.status === 'Pending'">
        <template v-if="confirmingDelete">
          <span class="confirm-label">Delete this request?</span>
          <Button label="Cancel" severity="secondary" text @click="confirmingDelete = false" />
          <Button label="Yes, delete" severity="danger" @click="emit('confirmed-delete', request!.id)" />
        </template>
        <template v-else>
          <Button label="Close" severity="secondary" @click="emit('update:visible', false)" />
          <Button label="Delete" severity="danger" outlined @click="confirmingDelete = true" />
        </template>
      </template>
      <Button v-else label="Close" severity="secondary" @click="emit('update:visible', false)" />
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

.confirm-label {
  font-size: 0.85rem;
  color: #555;
  margin-right: auto;
  align-self: center;
}
</style>
