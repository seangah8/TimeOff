<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-user">
      <i class="pi pi-user" />
      <span class="topbar-name">{{ auth.user?.name }}</span>
      <span class="topbar-role">{{ auth.user?.role }}</span>
    </div>
    <Button label="Logout" severity="secondary" text size="small" @click="handleLogout" />
  </header>
</template>

<style scoped>
.topbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e7eaec;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1.5rem;
  gap: 1rem;
  flex-shrink: 0;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #676a6c;
  font-size: 0.875rem;
}

.topbar-name {
  font-weight: 600;
}

.topbar-role {
  background: #f3f3f4;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #999;
}
</style>
