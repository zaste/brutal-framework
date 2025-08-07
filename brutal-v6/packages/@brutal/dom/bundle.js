import { readFileSync, writeFileSync } from 'fs';
import { minify } from 'terser';

// Read and clean files
function cleanFile(content) {
  return content
    .replace(/^export\s+/gm, '') // Remove export keywords
    .replace(/^import\s+.+$/gm, ''); // Remove imports
}

// Read built files
const template = cleanFile(readFileSync('dist/template.js', 'utf8'));
const render = cleanFile(readFileSync('dist/render.js', 'utf8'));
const query = cleanFile(readFileSync('dist/query.js', 'utf8'));

// Combine
let bundle = `${template}\n${render}\n${query}\nexport{html,render,query,queryAll};`;

// Write unminified for debugging
writeFileSync('dist/brutal-dom.js', bundle);
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
      properties: {
        regex: /^_c$/
      }
    },
    format: {
      comments: false,
      ascii_only: true
    }
  });

  writeFileSync('dist/brutal-dom.min.js', result.code);
  console.log('Minified size:', result.code.length, 'bytes');
} catch (e) {
  console.error('Minification error:', e.message);
}