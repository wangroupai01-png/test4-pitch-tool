import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/utils/**/*.ts', 'src/services/**/*.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
    },
  },
});
