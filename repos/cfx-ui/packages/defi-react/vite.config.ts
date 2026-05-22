import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const reactExternals = new Set(['react', 'react-dom', 'react/jsx-runtime']);

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'swap/index': 'src/swap/index.ts',
        'balance/index': 'src/balance/index.ts',
        'token-picker/index': 'src/token-picker/index.ts',
        'tx-status/index': 'src/tx-status/index.ts',
        'primitives/index': 'src/primitives/index.tsx',
        'service/index': 'src/service/index.ts',
        'pool/index': 'src/pool/index.ts',
        'lp/index': 'src/lp/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
      external: (id) => reactExternals.has(id) || (!id.startsWith('.') && !id.startsWith('/')),
    },
    sourcemap: true,
    minify: false,
    target: 'es2023',
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
});
