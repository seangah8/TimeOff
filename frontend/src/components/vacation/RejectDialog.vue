<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import type { VacationRequest } from '@/types';

const props = defineProps<{ visible: boolean; loading: boolean; request: VacationRequest | null }>();

watch(() => props.visible, (val) => {
  if (!val) {
    comment.value = '';
    commentError.value = '';
  }
});
const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirmed: [comment: string];
}>();

const comment = ref('');
const commentError = ref('');

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function handleConfirm() {
  if (!comment.value.trim()) {
    commentError.value = 'A comment is required when rejecting a request.';
    return;
  }
  emit('confirmed', comment.value.trim());
}

function handleHide() {
  comment.value = '';
  commentError.value = '';
  emit('update:visible', false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Reject Request"
    modal
    :style="{ width: '900px' }"
    @update:visible="handleHide"
  >
    <div class="reject-layout">
      <div v-if="request" class="request-card">
        <p class="card-title">Request Details</p>
        <div class="detail-field">
          <span class="detail-label">Requester</span>
          <span class="detail-value">{{ request.requester.name }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Period</span>
          <span class="detail-value">{{ formatDate(request.startDate) }} → {{ formatDate(request.endDate) }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Reason</span>
          <span class="detail-value detail-reason">{{ request.reason || 'No reason provided' }}</span>
        </div>
      </div>

      <div class="reject-body">
        <p class="reject-hint">Please provide a reason for the rejection.</p>
        <Textarea
          v-model="comment"
          placeholder="Enter your comment..."
          rows="5"
          :disabled="loading"
          style="width: 100%"
          autofocus
        />
        <p v-if="commentError" class="comment-error">{{ commentError }}</p>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" text :disabled="loading" @click="handleHide" />
      <Button label="Reject" severity="danger" class="reject-btn" :loading="loading" @click="handleConfirm" />
    </template>
  </Dialog>
</template>

<style scoped>
.reject-layout {
  display: flex;
  gap: 1.25rem;
  padding-top: 0.25rem;
}

.request-card {
  flex-shrink: 0;
  width: 360px;
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

.reject-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reject-hint {
  font-size: 0.875rem;
  color: #676a6c;
}

.comment-error {
  color: #ed5565;
  font-size: 0.875rem;
}

:deep(.reject-btn.p-button) {
  background: #f0dede !important;
  border-color: #f0dede !important;
  color: #8b3030 !important;
}
:deep(.reject-btn.p-button:hover) {
  background: #e5cccc !important;
  border-color: #e5cccc !important;
}
</style>
