import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const port = Number(process.env.VITE_DEV_PORT ?? 5176);
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2023',
    sourcemap: true,
  },
  server: {
    port,
    host: '0.0.0.0',
    strictPort: Boolean(process.env.VITE_DEV_PORT),
  },
});
