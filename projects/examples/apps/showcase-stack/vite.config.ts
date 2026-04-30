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
    port: 5175,
    host: '127.0.0.1',
  },
});
