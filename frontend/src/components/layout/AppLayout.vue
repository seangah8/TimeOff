<script setup lang="ts">
import { RouterView } from 'vue-router';
import Toast from 'primevue/toast';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppTopbar />
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
  <Toast />
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f3f3f4;
  min-width: 0;
}

.app-content {
  flex: 1;
  padding: 1.5rem;
}
</style>
