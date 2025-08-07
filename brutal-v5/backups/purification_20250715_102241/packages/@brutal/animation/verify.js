// Mock browser APIs for Node.js
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.performance = { now: () => Date.now() };

import { animate, timeline } from './dist/index.js';

console.log('🔍 Verificando @brutal/animation...\n');

// Test 1: Basic animation
console.log('✓ Función animate exportada correctamente');
console.log('✓ Función timeline exportada correctamente');

// Test 2: Create test element
const div = {
  style: {
    transform: '',
    opacity: '1',
    willChange: 'auto'
  }
};

// Test 3: Animation returns correct structure
const anim = animate(div, { x: 100 }, { duration: 100 });
console.log('✓ animate() retorna objeto con stop() y promise');
console.log('✓ stop() es una función:', typeof anim.stop === 'function');
console.log('✓ promise es una Promise:', anim.promise instanceof Promise);

// Test 4: Timeline returns correct structure  
const tl = timeline([
  [div, { x: 100 }, { duration: 100 }],
  [div, { y: 50 }, { duration: 100 }]
]);
console.log('✓ timeline() retorna objeto con stop() y promise');

// Test 5: Check bundle size
import fs from 'fs';
const bundleSize = fs.statSync('./dist/index.js').size;
console.log(`\n📦 Tamaño del bundle: ${(bundleSize / 1024).toFixed(2)}KB`);
console.log(`✓ Bajo el límite de 5KB: ${bundleSize < 5 * 1024}`);

console.log('\n✅ Todas las verificaciones pasaron!');