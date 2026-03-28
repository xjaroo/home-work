import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/families': { target: 'http://localhost:3000', changeOrigin: true },
      '/parents': { target: 'http://localhost:3000', changeOrigin: true },
      '/invite': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      bypass(req) {
        if (req.method === 'GET') return '/index.html';
      },
    },
      '/tasks': { target: 'http://localhost:3000', changeOrigin: true },
      '/kids': { target: 'http://localhost:3000', changeOrigin: true },
      '/money': { target: 'http://localhost:3000', changeOrigin: true },
      '/messages': { target: 'http://localhost:3000', changeOrigin: true },
      '/parent-chat': { target: 'http://localhost:3000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:3000', changeOrigin: true },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass(req) {
          if (req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
      '/health': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
