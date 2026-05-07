import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
