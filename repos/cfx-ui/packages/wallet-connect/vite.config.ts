import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const reactExternals = new Set(['react', 'react-dom', 'react/jsx-runtime']);

export default defineConfig({
  build: {
    lib: {
      entry: {
        'config/index': 'src/config/index.ts',
        'hooks/index': 'src/hooks/index.ts',
        index: 'src/index.ts',
        'siwe/index': 'src/siwe/index.ts',
        'ui/index': 'src/ui/index.ts',
        'auth/index': 'src/auth/index.tsx',
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
  ],
});
