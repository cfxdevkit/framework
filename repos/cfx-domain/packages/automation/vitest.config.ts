import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@cfxdevkit/executor': new URL(
        '../../../cfx-core/packages/executor/src/index.ts',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: false,
    reporters: ['default'],
  },
});
