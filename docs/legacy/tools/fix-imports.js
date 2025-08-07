#!/usr/bin/env node

/**
 * Script to update all require() statements to ES6 imports
 * and fix .cjs references to .js
 */

const fs = require('fs').promises;
const path = require('path');

// Mapping of old .cjs files to new .js paths
const fileMapping = {
  // Core systems
  './native-state-manager.cjs': './state-manager.js',
  '../native-state-manager.cjs': '../state-manager.js',
  './native-router.cjs': './router.js',
  '../native-router.cjs': '../router.js',
  './native-ssr-system.cjs': './ssr.js',
  '../native-ssr-system.cjs': '../ssr.js',
  './native-component-base.cjs': './component-base.js',
  '../native-component-base.cjs': '../component-base.js',
  
  // Core engine
  './native-framework-core.cjs': './framework-core.js',
  '../native-framework-core.cjs': '../framework-core.js',
  './missing-base-framework.cjs': './base-framework.js',
  '../missing-base-framework.cjs': '../base-framework.js',
  
  // Performance
  './event-handling-optimizer.cjs': './events.js',
  '../event-handling-optimizer.cjs': '../events.js',
  './template-optimizer.cjs': './templates.js',
  '../template-optimizer.cjs': '../templates.js',
  './performance-optimization-engine.cjs': './engine.js',
  '../performance-optimization-engine.cjs': '../engine.js',
  './shadow-dom-optimizer.cjs': './shadow-dom.js',
  '../shadow-dom-optimizer.cjs': '../shadow-dom.js',
  './css-styling-optimizer.cjs': './style.js',
  '../css-styling-optimizer.cjs': '../style.js',
  
  // Add more mappings as needed
};

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Replace require statements with imports
    const requireRegex = /const\s*{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
    const requireSingleRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
    
    // Process destructured requires
    content = content.replace(requireRegex, (match, imports, modulePath) => {
      modified = true;
      const newPath = fileMapping[modulePath] || modulePath.replace('.cjs', '.js');
      return `import { ${imports} } from '${newPath}';`;
    });
    
    // Process single requires
    content = content.replace(requireSingleRegex, (match, varName, modulePath) => {
      modified = true;
      const newPath = fileMapping[modulePath] || modulePath.replace('.cjs', '.js');
      return `import ${varName} from '${newPath}';`;
    });
    
    // Replace module.exports with export
    if (content.includes('module.exports')) {
      modified = true;
      content = content.replace(/module\.exports\s*=\s*{([^}]+)}/g, 'export {$1}');
      content = content.replace(/module\.exports\s*=\s*(\w+);?/g, 'export default $1;');
    }
    
    // Fix any remaining .cjs references
    if (content.includes('.cjs')) {
      modified = true;
      for (const [oldPath, newPath] of Object.entries(fileMapping)) {
        content = content.replace(new RegExp(oldPath.replace('.', '\\.'), 'g'), newPath);
      }
      // Generic .cjs to .js replacement
      content = content.replace(/\.cjs/g, '.js');
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function findJsFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
        await findJsFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function main() {
  console.log('🔧 Fixing imports in framework files...\n');
  
  const frameworkDir = path.join(__dirname, '../framework');
  const files = await findJsFiles(frameworkDir);
  
  console.log(`Found ${files.length} JavaScript files to check\n`);
  
  let updatedCount = 0;
  for (const file of files) {
    const updated = await processFile(file);
    if (updated) updatedCount++;
  }
  
  console.log(`\n✨ Complete! Updated ${updatedCount} files.`);
}

main().catch(console.error);