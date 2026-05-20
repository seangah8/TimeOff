<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import axios from 'axios';
import { useRequesterVacations } from '@/composables/useVacations';
import VacationForm from '@/components/vacation/VacationForm.vue';
import VacationList from '@/components/vacation/VacationList.vue';
import type { ApiError } from '@/types';

const toast = useToast();
const { requests, loading, fetchRequests, submitRequest, deleteRequest } = useRequesterVacations();
const submitting = ref(false);
const showForm = ref(false);

onMounted(fetchRequests);

async function handleDeleteRequest(id: number) {
  try {
    await deleteRequest(id);
    toast.add({ severity: 'success', summary: 'Request deleted', life: 3000 });
    await fetchRequests();
  } catch (e) {
    const message =
      axios.isAxiosError(e) && e.response
        ? (e.response.data as ApiError).error
        : 'Failed to delete request';
    toast.add({ severity: 'error', summary: message, life: 4000 });
  }
}

async function handleSubmitted(payload: {
  startDate: string;
  endDate: string;
  reason: string;
}) {
  submitting.value = true;
  try {
    await submitRequest(payload);
    showForm.value = false;
    toast.add({ severity: 'success', summary: 'Request submitted', life: 3000 });
    await fetchRequests();
  } catch (e) {
    const message =
      axios.isAxiosError(e) && e.response
        ? (e.response.data as ApiError).error
        : 'Failed to submit request';
    toast.add({ severity: 'error', summary: message, life: 4000 });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">My Vacation Requests</h1>
      <Button label="New Request" icon="pi pi-plus" @click="showForm = true" />
    </div>
    <VacationList :requests="requests" :loading="loading" allow-delete @delete-request="handleDeleteRequest" />
    <Dialog
      v-model:visible="showForm"
      header="New Vacation Request"
      modal
      :style="{ width: '520px' }"
    >
      <VacationForm :submitting="submitting" @submitted="handleSubmitted" />
    </Dialog>
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
</style>
