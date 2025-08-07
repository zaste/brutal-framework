import { defineConfig } from 'rollup';

const bundles = [
  { input: 'bundles/brutal-lite.js', output: 'brutal-lite', size: '15KB' },
  { input: 'bundles/brutal-core.js', output: 'brutal-core', size: '35KB' },
  { input: 'bundles/brutal-enhanced.js', output: 'brutal-enhanced', size: '55KB' },
  { input: 'bundles/brutal-ui.js', output: 'brutal-ui', size: '85KB' },
  { input: 'bundles/brutal-full.js', output: 'brutal-full', size: '155KB' }
];

export default bundles.map(bundle => defineConfig({
  input: bundle.input,
  output: [
    {
      file: `dist/bundles/${bundle.output}.js`,
      format: 'es',
      sourcemap: true
    },
    {
      file: `dist/bundles/${bundle.output}.min.js`,
      format: 'es',
      sourcemap: true,
      plugins: [] // Will add terser when we install deps
    }
  ],
  external: [], // Bundle everything for now
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false
  }
}));