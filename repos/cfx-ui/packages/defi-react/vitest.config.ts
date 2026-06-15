import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Resolve to @cfxdevkit/react source (../react/src from packages/defi-react/)
const reactSrc = resolve(__dirname, '../react/src');

const reactSubpaths = {
  balance: 'balance.ts',
  context: 'context.tsx',
  account: 'account.ts',
  contract: 'contract.ts',
  events: 'events.ts',
  tx: 'tx.ts',
  keystore: 'keystore/index.ts',
};

/**
 * Vite plugin to resolve @cfxdevkit/react subpath imports to source files
 * during testing (where dist/ is not available).
 */
function reactSubpathPlugin() {
  return {
    name: 'defi-react-react-subpaths',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@cfxdevkit/react') {
        return { id: resolve(reactSrc, 'index.ts'), external: false, moduleSideEffects: true };
      }
      for (const [subpath, file] of Object.entries(reactSubpaths)) {
        if (source === `@cfxdevkit/react/${subpath}`) {
          return { id: resolve(reactSrc, file), external: false, moduleSideEffects: true };
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [reactSubpathPlugin()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: false,
    reporters: ['default'],
    deps: {
      optimizer: {
        ssr: {
          include: [],
          exclude: ['@cfxdevkit/react'],
        },
      },
    },
  },
});
