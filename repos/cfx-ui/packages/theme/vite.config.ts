import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const reactExternals = new Set(['react', 'react-dom', 'react/jsx-runtime']);

/** Copies src/css/*.css → dist/css/*.css after the JS build completes. */
const copyCssPlugin = {
  name: 'copy-css',
  closeBundle() {
    mkdirSync('dist/css', { recursive: true });
    copyFileSync('src/css/base.css', 'dist/css/base.css');
    copyFileSync('src/css/dark.css', 'dist/css/dark.css');
  },
} as const;

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'tokens/index': 'src/tokens.ts',
        'react/index': 'src/react.tsx',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
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
    copyCssPlugin,
  ],
});
