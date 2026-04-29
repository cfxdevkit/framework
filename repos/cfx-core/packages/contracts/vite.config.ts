import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'abis/index': 'src/abis/index.ts',
        'errors/index': 'src/errors/index.ts',
        'read/index': 'src/read/index.ts',
        'write/index': 'src/write/index.ts',
        'deploy/index': 'src/deploy/index.ts',
        'erc20/index': 'src/erc20/index.ts',
        'bridge/index': 'src/bridge/index.ts',
      },
      formats: ['es'],
      fileName: (_format, entry) => `${entry}.js`,
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
