#!/usr/bin/env node

/**
 * Build all packages in dependency order
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Build order based on dependency graph
const BUILD_ORDER = [
  '@brutal/foundation',
  '@brutal/shared', 
  '@brutal/events',
  '@brutal/state',
  '@brutal/components'
];

console.log('🔨 Building packages in dependency order...\n');

for (const pkg of BUILD_ORDER) {
  const packagePath = path.join(ROOT, 'packages', pkg);
  
  if (!fs.existsSync(packagePath)) {
    console.log(`⏭️  Skipping ${pkg} (not found)`);
    continue;
  }
  
  console.log(`📦 Building ${pkg}...`);
  
  try {
    execSync('npm run build', {
      cwd: packagePath,
      stdio: 'inherit'
    });
    console.log(`✅ ${pkg} built successfully!\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${pkg}\n`);
    process.exit(1);
  }
}

console.log('✨ All packages built successfully!');