import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend habla SIEMPRE con el backend proxy, nunca directamente con
// AviationStack. En desarrollo, /api se redirige al backend en :3001.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
