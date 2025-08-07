#!/usr/bin/env node
// BRUTAL V5 - API Compatibility Validator
// Ensures no breaking changes during purification

const fs = require('fs');
const path = require('path');

const CURRENT_STATE_DIR = path.join(__dirname, 'current-state');
const PACKAGES_DIR = path.join(__dirname, '../../packages/@brutal');

class APIValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validatePackage(pkgName) {
    console.log(`🔍 Validating @brutal/${pkgName}...`);
    
    // Load original state
    const statePath = path.join(CURRENT_STATE_DIR, `${pkgName}.json`);
    if (!fs.existsSync(statePath)) {
      this.warnings.push(`No baseline state for ${pkgName}`);
      return;
    }
    
    const originalState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const currentExports = this.getCurrentExports(pkgName);
    
    // Check for missing exports
    Object.keys(originalState.exports).forEach(exportName => {
      if (!currentExports.has(exportName)) {
        this.errors.push({
          package: pkgName,
          type: 'missing_export',
          export: exportName,
          originalType: originalState.exports[exportName].type
        });
      }
    });
    
    // Check for type changes
    currentExports.forEach((type, name) => {
      if (originalState.exports[name] && originalState.exports[name].type !== type) {
        this.warnings.push({
          package: pkgName,
          type: 'type_change',
          export: name,
          from: originalState.exports[name].type,
          to: type
        });
      }
    });
    
    console.log(`  ✅ Original exports: ${Object.keys(originalState.exports).length}`);
    console.log(`  ✅ Current exports: ${currentExports.size}`);
    console.log(`  ${this.errors.length > 0 ? '❌' : '✅'} Compatibility: ${this.errors.length === 0 ? 'PASS' : 'FAIL'}`);
  }
  
  getCurrentExports(pkgName) {
    const exports = new Map();
    const srcPath = path.join(PACKAGES_DIR, pkgName, 'src');
    
    if (!fs.existsSync(srcPath)) return exports;
    
    function scanFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exportMatches = content.matchAll(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
        for (const match of exportMatches) {
          const type = match[0].includes('function') ? 'function' : 
                      match[0].includes('class') ? 'class' :
                      match[0].includes('interface') ? 'interface' :
                      match[0].includes('type') ? 'type' : 'const';
          exports.set(match[1], type);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    function scanDir(dir) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
          scanFile(fullPath);
        }
      });
    }
    
    scanDir(srcPath);
    return exports;
  }
  
  generateReport() {
    console.log('\n📋 VALIDATION REPORT');
    console.log('===================\n');
    
    if (this.errors.length === 0) {
      console.log('✅ All APIs are compatible!\n');
    } else {
      console.log(`❌ Found ${this.errors.length} compatibility errors:\n`);
      
      this.errors.forEach(error => {
        console.log(`  - ${error.package}: Missing export '${error.export}' (was ${error.originalType})`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings:`);
      this.warnings.forEach(warning => {
        if (warning.type === 'type_change') {
          console.log(`  - ${warning.package}: '${warning.export}' changed from ${warning.from} to ${warning.to}`);
        } else {
          console.log(`  - ${warning}`);
        }
      });
    }
    
    return this.errors.length === 0;
  }
}

// Main execution
const validator = new APIValidator();
const CORE_PACKAGES = [
  'foundation', 'shared', 'events', 'templates', 'components',
  'state', 'routing', 'cache', 'http', 'validation', 'animation', 'testing'
];

// Check if current state exists
if (!fs.existsSync(CURRENT_STATE_DIR)) {
  console.error('❌ No current state found. Run document-current-state.js first!');
  process.exit(1);
}

console.log('🛡️  Validating API Compatibility...\n');

CORE_PACKAGES.forEach(pkg => {
  validator.validatePackage(pkg);
  console.log('');
});

const isCompatible = validator.generateReport();

if (!isCompatible) {
  console.log('\n❌ API compatibility check failed!');
  console.log('Fix the missing exports before proceeding.\n');
  process.exit(1);
} else {
  console.log('\n✅ API compatibility check passed!\n');
}