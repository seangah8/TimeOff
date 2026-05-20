<script setup lang="ts">
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <img src="/timeoff_icon.svg" class="logo-icon" alt="" aria-hidden="true" />
      TimeOff
    </div>
    <nav>
      <RouterLink
        v-if="auth.user?.role === 'Requester'"
        to="/requester"
        class="nav-item"
        :class="{ active: route.path.startsWith('/requester') }"
      >
        <i class="pi pi-calendar" />
        My Requests
      </RouterLink>
      <RouterLink
        v-if="auth.user?.role === 'Validator'"
        to="/validator"
        class="nav-item"
        :class="{ active: route.path === '/validator' }"
      >
        <i class="pi pi-list" />
        All Requests
      </RouterLink>
      <RouterLink
        v-if="auth.user?.role === 'Validator'"
        to="/validator/charts"
        class="nav-item"
        :class="{ active: route.path === '/validator/charts' }"
      >
        <i class="pi pi-chart-bar" />
        Statistics & Charts
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  height: 100%;
  background-color: #2f4050;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.5rem 1.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.05em;
}

.logo-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

nav {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  color: #a7b1c2;
  text-decoration: none;
  font-size: 0.875rem;
  border-left: 3px solid transparent;
  transition:
    color 0.15s,
    background-color 0.15s,
    border-color 0.15s;
}

.nav-item:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #fff;
  border-left-color: #1ab394;
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
