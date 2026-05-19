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
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
});

const PUBLIC_ROUTES = ['/login', '/register', '/403', '/404'];

let initialized = false;

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!initialized) {
    await auth.fetchMe();
    initialized = true;
  }

  const isLoggedIn = !!auth.user;
  const isPublic = PUBLIC_ROUTES.includes(to.path);

  if (!isLoggedIn && !isPublic) return '/login';

  if (isLoggedIn) {
    const dashboard = auth.user!.role === 'Requester' ? '/requester' : '/validator';

    if (to.path === '/login' || to.path === '/register' || to.path === '/') {
      return dashboard;
    }

    if (to.path.startsWith('/requester') && auth.user!.role !== 'Requester') return '/403';
    if (to.path.startsWith('/validator') && auth.user!.role !== 'Validator') return '/403';
  }
});

export default router;
