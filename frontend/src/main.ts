import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';

import App from './App.vue';
import router from './router';

const TealPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#edfaf7',
      100: '#d0f4ec',
      200: '#a1e9d9',
      300: '#6edcc4',
      400: '#3ec9ac',
      500: '#1ab394',
      600: '#14907a',
      700: '#0f7362',
      800: '#0c5a4d',
      900: '#0a4a3f',
      950: '#052e27',
    },
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: TealPreset,
    options: {
      darkModeSelector: false,
    },
  },
});
app.use(ToastService);

app.mount('#app');
