<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
const router = useRouter();
</script>

<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <div class="error-message">Page not found</div>
    <Button label="Go Home" @click="router.push('/')" />
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
}
.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: #1ab394;
  line-height: 1;
}
.error-message {
  font-size: 1.5rem;
  color: #676a6c;
}
</style>
