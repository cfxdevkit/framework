import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const reactExternals = new Set(['react', 'react-dom', 'react/jsx-runtime']);

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
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
  ],
});
