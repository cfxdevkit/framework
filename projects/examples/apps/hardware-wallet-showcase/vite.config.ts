import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const port = Number(process.env.VITE_DEV_PORT ?? 5177);
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    include: ['buffer'],
  },
  define: {
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
    proxy: {
      '/compile': 'http://127.0.0.1:5174',
      '/devnode': 'http://127.0.0.1:5174',
      '/rpc': 'http://127.0.0.1:5174',
    },
  },
});
