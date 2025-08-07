import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false, // Size-limit will handle production builds
  target: 'es2022',
  outDir: 'dist',
  external: [/@brutal\//], // Mark all @brutal packages as external
  treeshake: true,
  splitting: false,
  env: {
    __VERSION__: process.env.npm_package_version || '0.0.0'
  },
  esbuildOptions(options) {
    options.banner = {
      js: '/* BRUTAL V5 - Zero-dependency web framework */'
    };
  }
});