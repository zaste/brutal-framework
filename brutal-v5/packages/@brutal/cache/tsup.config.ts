import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [],
  noExternal: [/.*/], // Bundle everything
  outExtension({ format }) {
    return {
      js: '.js'
    };
  },
  onSuccess: 'echo "✅ Build successful"'
});