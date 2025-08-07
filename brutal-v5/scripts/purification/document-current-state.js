#!/usr/bin/env node
// BRUTAL V5 - Document Current State
// Captures current API surface, exports, and bundle sizes

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES_DIR = path.join(__dirname, '../../packages/@brutal');
const OUTPUT_DIR = path.join(__dirname, 'current-state');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Core packages to analyze
const CORE_PACKAGES = [
  'foundation', 'shared', 'events', 'templates', 'components',
  'state', 'routing', 'cache', 'http', 'validation', 'animation', 'testing'
];

function analyzePackage(pkgName) {
  console.log(`📊 Analyzing @brutal/${pkgName}...`);
  
  const pkgPath = path.join(PACKAGES_DIR, pkgName);
  const srcPath = path.join(pkgPath, 'src');
  
  const state = {
    name: `@brutal/${pkgName}`,
    timestamp: new Date().toISOString(),
    exports: {},
    files: [],
    bundleSize: null,
    dependencies: {},
    consumers: []
  };
  
  // Analyze src directory structure
  if (fs.existsSync(srcPath)) {
    function scanDir(dir, base = '') {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(base, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
          state.files.push(relativePath);
          
          // Extract exports
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const exportMatches = content.matchAll(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
            for (const match of exportMatches) {
              state.exports[match[1]] = {
                file: relativePath,
                type: match[0].includes('function') ? 'function' : 
                      match[0].includes('class') ? 'class' :
                      match[0].includes('interface') ? 'interface' :
                      match[0].includes('type') ? 'type' : 'const'
              };
            }
          } catch (e) {
            console.warn(`  ⚠️  Could not parse ${relativePath}`);
          }
        }
      });
    }
    scanDir(srcPath);
  }
  
  // Get package.json dependencies
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    state.dependencies = pkgJson.dependencies || {};
  }
  
  // Find consumers (packages that import this one)
  CORE_PACKAGES.forEach(consumer => {
    if (consumer === pkgName) return;
    const consumerSrc = path.join(PACKAGES_DIR, consumer, 'src');
    if (fs.existsSync(consumerSrc)) {
      try {
        const imports = execSync(
          `grep -r "from '@brutal/${pkgName}" ${consumerSrc} 2>/dev/null | wc -l`,
          { encoding: 'utf8' }
        ).trim();
        if (parseInt(imports) > 0) {
          state.consumers.push(`@brutal/${consumer}`);
        }
      } catch (e) {
        // Ignore grep errors
      }
    }
  });
  
  // Try to get bundle size (if built)
  const distPath = path.join(pkgPath, 'dist');
  if (fs.existsSync(distPath)) {
    try {
      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.map'));
      let totalSize = 0;
      jsFiles.forEach(file => {
        const stats = fs.statSync(path.join(distPath, file));
        totalSize += stats.size;
      });
      state.bundleSize = totalSize;
    } catch (e) {
      // Ignore
    }
  }
  
  // Save state
  const outputPath = path.join(OUTPUT_DIR, `${pkgName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(state, null, 2));
  
  console.log(`  ✅ Exports: ${Object.keys(state.exports).length}`);
  console.log(`  ✅ Files: ${state.files.length}`);
  console.log(`  ✅ Consumers: ${state.consumers.length}`);
  
  return state;
}

// Analyze all packages
console.log('🔍 Documenting current state of BRUTAL V5 packages...\n');

const summary = {
  timestamp: new Date().toISOString(),
  packages: {}
};

CORE_PACKAGES.forEach(pkg => {
  try {
    const state = analyzePackage(pkg);
    summary.packages[pkg] = {
      exports: Object.keys(state.exports).length,
      files: state.files.length,
      bundleSize: state.bundleSize,
      consumers: state.consumers.length
    };
  } catch (e) {
    console.error(`❌ Error analyzing ${pkg}:`, e.message);
  }
  console.log('');
});

// Save summary
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('✅ State documentation complete!');
console.log(`📁 Output: ${OUTPUT_DIR}`);

// Generate compatibility matrix
const compatMatrix = {
  exports: {},
  imports: {}
};

CORE_PACKAGES.forEach(pkg => {
  const statePath = path.join(OUTPUT_DIR, `${pkg}.json`);
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    compatMatrix.exports[pkg] = Object.keys(state.exports);
    compatMatrix.imports[pkg] = state.consumers;
  }
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'compatibility-matrix.json'),
  JSON.stringify(compatMatrix, null, 2)
);

console.log('📊 Compatibility matrix generated');