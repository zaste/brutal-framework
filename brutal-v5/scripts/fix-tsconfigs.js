#!/usr/bin/env node

/**
 * Fix tsconfig paths in all packages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = path.join(__dirname, '../packages/@brutal');

const packages = fs.readdirSync(PACKAGES_DIR);
packages.forEach(pkg => {
  const packagePath = path.join(PACKAGES_DIR, pkg);
  if (fs.statSync(packagePath).isDirectory()) {
    const tsconfigPath = path.join(packagePath, 'tsconfig.json');
    
    const tsconfig = {
      extends: '../../../tsconfig.json',
      compilerOptions: {
        rootDir: './src',
        outDir: './dist',
        declarationDir: './dist'
      },
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.bench.ts', 'dist', 'node_modules']
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`✅ Fixed tsconfig for @brutal/${pkg}`);
  }
});

console.log('\n✨ All tsconfigs fixed!');