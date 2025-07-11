/**
 * Optimize bundle sizes - remove duplicates and unnecessary code
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const DIST_DIR = './dist';

async function optimizeBundle(filePath) {
    let code = await readFile(filePath, 'utf8');
    const originalSize = code.length;
    
    // Remove duplicate class definitions
    const classMap = new Map();
    code = code.replace(/class\s+(\w+)(?:\s+extends\s+\w+)?\s*{[^}]+}/g, (match, className) => {
        if (classMap.has(className)) {
            return ''; // Remove duplicate
        }
        classMap.set(className, match);
        return match;
    });
    
    // Remove duplicate function definitions
    const funcMap = new Map();
    code = code.replace(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]+}/g, (match, funcName) => {
        if (funcMap.has(funcName)) {
            return ''; // Remove duplicate
        }
        funcMap.set(funcName, match);
        return match;
    });
    
    // Remove empty statements
    code = code.replace(/;+/g, ';');
    code = code.replace(/{\s*}/g, '{}');
    
    // Optimize object property access
    code = code.replace(/\['([a-zA-Z_]\w*)'\]/g, '.$1');
    
    // Remove redundant return statements
    code = code.replace(/return\s+void\s+0;?/g, 'return');
    
    // Inline single-use variables
    code = code.replace(/const\s+(\w+)=([^;]+);return\s+\1;/g, 'return$2;');
    
    // Further minification
    code = code.replace(/\s*([=+\-*/%<>!&|^~?:,;{}()\[\]])\s*/g, '$1');
    
    // Remove consecutive semicolons
    code = code.replace(/;{2,}/g, ';');
    
    // Write optimized version
    await writeFile(filePath, code, 'utf8');
    
    const newSize = code.length;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    return {
        file: filePath,
        originalSize: (originalSize / 1024).toFixed(2),
        newSize: (newSize / 1024).toFixed(2),
        reduction
    };
}

console.log('🔧 Optimizing bundles...\n');

const files = await readdir(DIST_DIR);
const results = [];

for (const file of files) {
    if (file.endsWith('.js')) {
        const result = await optimizeBundle(join(DIST_DIR, file));
        results.push(result);
        console.log(`✓ ${file}: ${result.originalSize}KB → ${result.newSize}KB (-${result.reduction}%)`);
    }
}

console.log('\n✅ Bundle optimization complete!');