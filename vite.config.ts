import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  // IMPORTANT for Electron (file://) builds:
  // Use relative asset paths so the packaged app can load JS/CSS from dist/assets.
  // Without this, Vite defaults to base='/' and Electron will try to load
  // file:///assets/... which results in a blank window.
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
