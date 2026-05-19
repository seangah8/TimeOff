import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    env: { DB_NAME: 'timeoff_test' },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
