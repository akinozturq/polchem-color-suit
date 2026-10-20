import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      js: path.resolve(__dirname, 'src/js'),
      css: path.resolve(__dirname, 'src/css'),
      img: path.resolve(__dirname, 'src/img'),
      'polchem_color_suit-base': path.resolve(__dirname, 'libs/polchem_base/src'),
      'easy-print': path.resolve(__dirname, 'libs/easy-print/src'),
      'easy-mail': path.resolve(__dirname, 'libs/easy-mail/src'),
    },
  },
  build: {
    outDir: '../backend/static/v1',
    emptyOutDir: false,
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://127.0.0.1:9720',
      '/query': 'http://127.0.0.1:9720',
      '/bundle': 'http://127.0.0.1:9720',
      '/matching': 'http://127.0.0.1:9720',
      '/pricing': 'http://127.0.0.1:9720',
      '/rest': 'http://127.0.0.1:9720',
      '/licensing': 'http://127.0.0.1:9720',
      '/translations': 'http://127.0.0.1:9720',
      '/api': 'http://127.0.0.1:9720',
    },
  },
});
