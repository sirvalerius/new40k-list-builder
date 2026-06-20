import { defineConfig } from 'vitest/config';

// Vitest reads this config (vite.config.ts handles the app build).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
