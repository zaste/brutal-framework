#!/usr/bin/env node
/**
 * Validate package size against limits
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIZE_LIMITS = {
  '@brutal/core': 2048,
  '@brutal/dom': 2048,
  '@brutal/state': 1024,
  '@brutal/events': 1024,
  '@brutal/router': 1024,
  '@brutal/animation': 1024,
  '@brutal/utils': 512
};

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (e) {
    return 0;
  }
}

function validatePackage() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const packageName = packageJson.name;
  const limit = SIZE_LIMITS[packageName];
  
  if (!limit) {
    console.error(`❌ No size limit defined for ${packageName}`);
    process.exit(1);
  }
  
  const distFile = path.join('dist', 'index.js');
  const size = getFileSize(distFile);
  
  if (size === 0) {
    console.warn(`⚠️  No dist file found for ${packageName}`);
    return;
  }
  
  console.log(`📦 ${packageName}`);
  console.log(`   Size: ${size}B / ${limit}B (${((size/limit)*100).toFixed(1)}%)`);
  
  if (size > limit) {
    console.error(`❌ Package exceeds size limit by ${size - limit}B`);
    process.exit(1);
  } else {
    console.log(`✅ Within size limit (${limit - size}B remaining)`);
  }
}

// Run validation
validatePackage();