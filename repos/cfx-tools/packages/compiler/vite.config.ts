import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'solc/index': 'src/solc/index.ts',
        'resolver/index': 'src/resolver/index.ts',
        'templates/index': 'src/templates/index.ts',
        artifacts: 'src/artifacts.ts',
        errors: 'src/errors.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/'),
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
