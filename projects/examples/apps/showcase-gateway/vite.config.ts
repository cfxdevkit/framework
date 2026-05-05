import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

const backend = 'http://127.0.0.1:5174';

function appProxy(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    ws: true,
  };
}

function backendProxy(): ProxyOptions {
  return {
    target: backend,
    changeOrigin: true,
  };
}

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/showcase': appProxy('http://127.0.0.1:5181'),
      '/stack': appProxy('http://127.0.0.1:5182'),
      '/browser': appProxy('http://127.0.0.1:5183'),
      '/hardware': appProxy('http://127.0.0.1:5184'),
      '/auth': backendProxy(),
      '/compile': backendProxy(),
      '/devnode': backendProxy(),
      '/health': backendProxy(),
      '/rpc': backendProxy(),
      '/session-key': backendProxy(),
      '/api': {
        ...backendProxy(),
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
