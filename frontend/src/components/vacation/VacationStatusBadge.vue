<script setup lang="ts">
import Tag from 'primevue/tag';
import type { VacationStatus } from '@/types';

const props = defineProps<{ status: VacationStatus }>();

const severityMap: Record<VacationStatus, 'success' | 'warn' | 'danger'> = {
  Approved: 'success',
  Pending: 'warn',
  Rejected: 'danger',
};
</script>

<template>
  <Tag :value="props.status" :severity="severityMap[props.status]" />
</template>
