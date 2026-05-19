import axios from 'axios';
import router from '@/router';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      import('@/stores/auth').then(({ useAuthStore }) => {
        useAuthStore().clearUser();
      });
      router.push('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
