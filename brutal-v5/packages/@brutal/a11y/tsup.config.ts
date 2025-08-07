import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  external: [/@brutal\//],
  treeshake: true,
  skipNodeModulesBundle: true,
  onSuccess: 'echo "✅ Build successful"'
});