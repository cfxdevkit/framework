import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'keystore/index': 'src/keystore/index.ts',
        'keystore/audit': 'src/keystore/audit.ts',
        'keystore/memory/index': 'src/keystore/memory/index.ts',
        'keystore/file/index': 'src/keystore/file/index.ts',
        'keystore/ledger/index': 'src/keystore/ledger/index.ts',
        'crypto/index': 'src/crypto/index.ts',
        'embedded-wallet/index': 'src/embedded-wallet/index.ts',
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
