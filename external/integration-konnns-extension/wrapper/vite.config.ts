import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [react()],
  server: {
    port: 3304,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/wallhaven-api': {
        target: 'https://wallhaven.cc/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wallhaven-api/, '')
      },
      '/wallhaven-img': {
        target: 'https://w.wallhaven.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wallhaven-img/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../konnns-extension/src'),
    },
  },
});
