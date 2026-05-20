<script setup lang="ts">
import { ref, computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

defineProps<{ submitting: boolean }>();
const emit = defineEmits<{
  submitted: [payload: { startDate: string; endDate: string; reason: string }];
}>();

const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const reason = ref('');
const dateError = ref('');

const minEndDate = computed(() => startDate.value ?? undefined);

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function handleSubmit() {
  dateError.value = '';

  if (!startDate.value || !endDate.value) {
    dateError.value = 'Both start and end dates are required.';
    return;
  }

  if (endDate.value < startDate.value) {
    dateError.value = 'End date cannot be before start date.';
    return;
  }

  emit('submitted', {
    startDate: formatDate(startDate.value),
    endDate: formatDate(endDate.value),
    reason: reason.value.trim(),
  });

  startDate.value = null;
  endDate.value = null;
  reason.value = '';
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="field">
          <label>Start Date</label>
          <DatePicker
            v-model="startDate"
            placeholder="Select start date"
            date-format="dd/mm/yy"
            :disabled="submitting"
            show-icon
            fluid
          />
        </div>
        <div class="field">
          <label>End Date</label>
          <DatePicker
            v-model="endDate"
            placeholder="Select end date"
            date-format="dd/mm/yy"
            :min-date="minEndDate"
            :disabled="submitting"
            show-icon
            fluid
          />
        </div>
      </div>
      <p v-if="dateError" class="field-error">{{ dateError }}</p>
      <div class="field">
        <label>Reason <span class="optional">(optional)</span></label>
        <Textarea
          v-model="reason"
          placeholder="Describe the reason for your request..."
          rows="3"
          :disabled="submitting"
          style="width: 100%"
        />
      </div>
      <Button
        type="submit"
        label="Submit Request"
        :loading="submitting"
        class="submit-btn"
      />
  </form>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #555;
}

.optional {
  font-weight: 400;
  color: #aaa;
}

.field-error {
  color: #ed5565;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  margin-top: -0.5rem;
}

.submit-btn {
  width: 100%;
}
</style>
