import { readFileSync, writeFileSync } from 'fs';
import { minify } from 'terser';

// Read and clean files
function cleanFile(content) {
  return content
    .replace(/^export\s+/gm, '') // Remove export keywords
    .replace(/^import\s+.+$/gm, ''); // Remove imports
}

// Read built files
const store = cleanFile(readFileSync('dist/store.js', 'utf8'));
const withStore = cleanFile(readFileSync('dist/with-store.js', 'utf8'));

// Combine
let bundle = `${store}\n${withStore}\nexport{createStore,withStore};`;

// Write unminified for debugging
writeFileSync('dist/brutal-state.js', bundle);
console.log('Bundle size:', bundle.length, 'bytes');

// Minify
try {
  const result = await minify(bundle, {
    compress: {
      passes: 3,
      pure_funcs: ['console.log'],
      drop_console: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
    },
    mangle: {
      toplevel: true,
      properties: {
        regex: /^_/
      }
    },
    format: {
      comments: false,
      ascii_only: true
    }
  });

  writeFileSync('dist/brutal-state.min.js', result.code);
  console.log('Minified size:', result.code.length, 'bytes');
} catch (e) {
  console.error('Minification error:', e.message);
}