import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'mcp-server/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    restoreMocks: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
