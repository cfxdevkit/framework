import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const backendProxy = {
  '/auth': 'http://127.0.0.1:5174',
  '/compile': 'http://127.0.0.1:5174',
  '/devnode': 'http://127.0.0.1:5174',
  '/health': 'http://127.0.0.1:5174',
  '/rpc': 'http://127.0.0.1:5174',
  '/session-key': 'http://127.0.0.1:5174',
};

const port = Number(process.env.VITE_DEV_PORT ?? 5173);
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
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
    port,
    host: '0.0.0.0',
    strictPort: Boolean(process.env.VITE_DEV_PORT),
    proxy: backendProxy,
  },
});
