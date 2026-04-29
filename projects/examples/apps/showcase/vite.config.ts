import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // siwe (and a few other ethereum libs) reach for Node's Buffer; ensure the
  // browser-shim is included in the dep-pre-bundle so it lands in the graph.
  optimizeDeps: {
    include: ['buffer'],
  },
  define: {
    // Some libs check `global.Buffer`; map it to the browser global.
    global: 'globalThis',
  },
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
