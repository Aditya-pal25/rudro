import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/admin-api': { target: 'http://127.0.0.1:5001', changeOrigin: true, secure: false },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
