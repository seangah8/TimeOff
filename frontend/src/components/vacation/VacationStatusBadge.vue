<script setup lang="ts">
import Tag from 'primevue/tag';
import type { VacationStatus } from '@/types';

const props = defineProps<{ status: VacationStatus }>();

const severityMap: Record<VacationStatus, 'success' | 'warn' | 'danger'> = {
  Approved: 'success',
  Pending: 'warn',
  Rejected: 'danger',
};

const ptMap: Record<VacationStatus, { root: { style: Record<string, string> } }> = {
  Approved: { root: { style: { background: '#d6ebe5', color: '#1a6b55' } } },
  Pending:  { root: { style: { background: '#fdefd6', color: '#7a5a10' } } },
  Rejected: { root: { style: { background: '#f0dede', color: '#8b3030' } } },
};
</script>

<template>
  <Tag :value="props.status" :severity="severityMap[props.status]" :pt="ptMap[props.status]" />
</template>
