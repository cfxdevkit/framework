import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'signers/index': 'src/signers/index.ts',
        'errors/index': 'src/errors/index.ts',
        'hardware/index': 'src/hardware/index.ts',
        'hardware/onekey/index': 'src/hardware/onekey/index.ts',
        'hardware/satochip/index': 'src/hardware/satochip/index.ts',
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
