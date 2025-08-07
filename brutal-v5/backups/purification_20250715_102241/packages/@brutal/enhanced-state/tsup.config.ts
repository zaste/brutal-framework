import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  external: [/@brutal\//],
  treeshake: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    // Remove console.log in production builds
    if (process.env.NODE_ENV === 'production') {
      options.drop = ['console'];
    }
  },
  onSuccess: 'echo "✅ Build successful"'
});