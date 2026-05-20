import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/pages/auth/LoginPage.vue') },
    { path: '/register', component: () => import('@/pages/auth/RegisterPage.vue') },
    { path: '/403', component: () => import('@/pages/errors/ForbiddenPage.vue') },
    { path: '/404', component: () => import('@/pages/errors/NotFoundPage.vue') },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        { path: 'requester', component: () => import('@/pages/requester/RequesterDashboard.vue') },
        { path: 'validator', component: () => import('@/pages/validator/ValidatorDashboard.vue') },
        { path: 'validator/charts', component: () => import('@/pages/validator/ValidatorCharts.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
});

// Public routes that do not require authentication.
const PUBLIC_ROUTES = ['/login', '/register', '/403', '/404'];

// Module-level flag so fetchMe() is only called once — on the very first navigation after
// a page load or refresh. After that, the guard trusts the value already in the store.
let initialized = false;

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!initialized) {
    // Restore the session from the httpOnly cookie on the first navigation.
    await auth.fetchMe();
    initialized = true;
  }

  const isLoggedIn = !!auth.user;
  const isPublic = PUBLIC_ROUTES.includes(to.path);

  // Unauthenticated users can only access public pages.
  if (!isLoggedIn && !isPublic) return '/login';

  if (isLoggedIn) {
    const dashboard = auth.user!.role === 'Requester' ? '/requester' : '/validator';

    // Logged-in users visiting the root or auth pages are redirected to their dashboard.
    if (to.path === '/login' || to.path === '/register' || to.path === '/') {
      return dashboard;
    }

    // Role-based access: a Requester cannot visit /validator and vice versa.
    if (to.path.startsWith('/requester') && auth.user!.role !== 'Requester') return '/403';
    if (to.path.startsWith('/validator') && auth.user!.role !== 'Validator') return '/403';
  }
});

export default router;
