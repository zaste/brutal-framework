import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@brutal/components': resolve(__dirname, '../components/src'),
      '@brutal/events': resolve(__dirname, '../events/src'),
      '@brutal/shared': resolve(__dirname, '../shared/src'),
      '@brutal/templates': resolve(__dirname, '../templates/src'),
    },
  },
  server: {
    port: 3334,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BrutalEnhanced',
      fileName: 'brutal-enhanced',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
});