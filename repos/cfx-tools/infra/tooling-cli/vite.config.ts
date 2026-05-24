import { chmodSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/** Vite plugin: set executable bit on dist/bin.js after every build.
 *  Vite writes files with 644; without this the `cdk` symlink loses +x. */
function chmodBin(): import('vite').Plugin {
  return {
    name: 'chmod-bin',
    closeBundle() {
      try {
        chmodSync('dist/bin.js', 0o755);
      } catch {
        // file may not exist yet on first run; install-cdk.sh handles it
      }
    },
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        bin: 'src/bin.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        banner: (chunk) => (chunk.name === 'bin' ? '#!/usr/bin/env node' : ''),
      },
    },
    sourcemap: true,
    minify: false,
    target: 'es2023',
  },
  plugins: [
    chmodBin(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    }),
  ],
});
