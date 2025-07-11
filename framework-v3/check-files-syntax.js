#!/usr/bin/env node

/**
 * Quick syntax check for all JavaScript files
 */

import fs from 'fs';
import { pathToFileURL } from 'url';

const files = [
  './01-core/Component.js',
  './01-core/State.js',
  './01-core/Router.js',
  './01-core/EnhancedComponent.js',
  './01-core/Template.js',
  './01-core/Registry.js',
  './02-performance/01-StyleManager.js',
  './02-performance/02-FragmentPool.js',
  './02-performance/03-DOMScheduler.js',
  './02-performance/04-TemplateCache.js',
  './02-performance/05-EventManager.js',
  './02-performance/06-ThemeEngine.js',
  './02-performance/07-LayoutOptimizer.js',
  './02-performance/index.js'
];

let errors = 0;

async function checkFile(file) {
  try {
    // Try to import the file to check syntax
    await import(pathToFileURL(file).href);
    return true;
  } catch (error) {
    errors++;
    return false;
  }
}

// Check all files
for (const file of files) {
  if (fs.existsSync(file)) {
    await checkFile(file);
  } else {
    errors++;
  }
}

process.exit(errors > 0 ? 1 : 0);