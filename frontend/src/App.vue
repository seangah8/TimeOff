<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    'Open Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  background: #f3f3f4;
  color: #333;
}

.p-datatable-loading-overlay {
  background: rgba(255, 255, 255, 0.75) !important;
}

.p-datatable-loading-icon {
  color: #1ab394 !important;
  width: 2.5rem !important;
  height: 2.5rem !important;
}
</style>
