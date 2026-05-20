<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import type { ApiError, UserRole } from '@/types';

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const role = ref<UserRole>('Requester');
const error = ref('');
const loading = ref(false);

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Requester', value: 'Requester' },
  { label: 'Validator', value: 'Validator' },
];

async function handleRegister() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(name.value, role.value);
    router.push('/');
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      const data = e.response.data as ApiError;
      error.value = data.details?.[0]?.message ?? data.error ?? 'Registration failed';
    } else {
      error.value = 'Something went wrong';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <img src="/timeoff_icon.svg" class="auth-logo" alt="" aria-hidden="true" />
        <h1 class="auth-brand">TimeOff</h1>
        <p class="auth-subtitle">Create your account</p>
      </div>
      <form @submit.prevent="handleRegister">
        <div class="field">
          <label for="name">Name</label>
          <InputText
            id="name"
            v-model="name"
            placeholder="Enter your name"
            :maxlength="50"
            :disabled="loading"
            autofocus
          />
        </div>
        <div class="field">
          <label>Role</label>
          <SelectButton
            v-model="role"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :disabled="loading"
          />
        </div>
        <p v-if="error" class="auth-error">{{ error }}</p>
        <Button type="submit" label="Create Account" :loading="loading" class="auth-submit" />
      </form>
      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f3f4;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  width: 52px;
  height: 52px;
  margin-bottom: 0.75rem;
}

.auth-brand {
  font-size: 2rem;
  font-weight: 700;
  color: #1ab394;
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  color: #999;
  font-size: 0.875rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #555;
}

.field :deep(.p-inputtext) {
  width: 100%;
}

.auth-error {
  color: #ed5565;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.auth-submit {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #999;
}

.auth-footer a {
  color: #1ab394;
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
