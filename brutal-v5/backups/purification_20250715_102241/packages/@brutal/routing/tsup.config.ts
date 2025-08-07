import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  external: ['@brutal/events', '@brutal/shared'],
  outExtension({ format }) {
    return {
      js: '.js'
    };
  },
  esbuildOptions(options) {
    options.drop = ['console', 'debugger'];
  },
  onSuccess: 'echo "✅ Build successful"'
});