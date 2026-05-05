import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

const backend = 'http://127.0.0.1:5174';

function appProxy(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    ws: true,
    // Disable compression so Content-Length headers from child Vite apps match
    // actual byte counts — prevents ERR_CONTENT_LENGTH_MISMATCH in the browser.
    headers: { 'accept-encoding': 'identity' },
  };
}

function aliasedAppProxy(target: string, from: RegExp, to: string): ProxyOptions {
  return {
    ...appProxy(target),
    rewrite: (path) => path.replace(from, to),
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
      '/keystores': appProxy('http://127.0.0.1:5184'),
      '/hardware': aliasedAppProxy('http://127.0.0.1:5184', /^\/hardware/, '/keystores'),
      '/auth': backendProxy(),
      '/compile': backendProxy(),
      '/devnode': backendProxy(),
      '/health': backendProxy(),
      '^/keystore(/|$)': backendProxy(),
      '/rpc': backendProxy(),
      '/session-key': backendProxy(),
      '/api': {
        ...backendProxy(),
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
