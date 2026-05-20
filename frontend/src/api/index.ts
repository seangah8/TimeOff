import axios from 'axios';
import router from '@/router';

// Single shared Axios instance used by every composable and store.
// withCredentials: true tells the browser to include the httpOnly cookie on every request.
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Response interceptor: if any request returns 401 (session expired or invalid),
// clear the local user state and redirect to the login page automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dynamic import breaks the circular dependency:
      // api → router → auth store → api.
      // Importing at call-time (not at module load) means the module graph is
      // fully resolved by the time this interceptor actually runs.
      import('@/stores/auth').then(({ useAuthStore }) => {
        useAuthStore().clearUser();
      });
      router.push('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
