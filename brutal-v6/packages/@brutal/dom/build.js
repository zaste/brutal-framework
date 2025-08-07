import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read all JS files except types.js
const files = [
  'template.js',
  'render.js', 
  'query.js',
  'mount.js',
  'patch.js',
  'index.js'
];

let bundle = '';

// Collect all exports
const exports = new Set();

files.forEach(file => {
  let content = readFileSync(join('dist', file), 'utf8');
  
  // Remove import statements
  content = content.replace(/^import .+ from .+;$/gm, '');
  
  // Track exports
  const exportMatches = content.matchAll(/export\s+(?:const|function)\s+(\w+)/g);
  for (const match of exportMatches) {
    exports.add(match[1]);
  }
  
  // Remove individual exports
  content = content.replace(/^export\s+/gm, '');
  
  bundle += content + '\n';
});

// Add consolidated exports
bundle += '\nexport { ' + Array.from(exports).join(', ') + ' };\n';

writeFileSync('dist/brutal-dom.js', bundle);

// Create minified version
let minified = bundle
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
  .replace(/\/\/.*/g, '') // Remove line comments
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around syntax
  .trim();

writeFileSync('dist/brutal-dom.min.js', minified);

// Report sizes
console.log('Bundle size:', bundle.length, 'bytes');
console.log('Minified size:', minified.length, 'bytes');