import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
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
    port: 5177,
    host: '0.0.0.0',
    proxy: {
      '/compile': 'http://127.0.0.1:5174',
      '/devnode': 'http://127.0.0.1:5174',
      '/rpc': 'http://127.0.0.1:5174',
    },
  },
});
