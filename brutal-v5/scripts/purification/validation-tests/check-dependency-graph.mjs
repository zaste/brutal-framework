#!/usr/bin/env node
// BRUTAL V5 - Dependency Graph Validator
// Ensures all packages follow the strict dependency graph

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.join(__dirname, '../../../packages/@brutal');

// Strict dependency graph
const ALLOWED_DEPENDENCIES = {
  foundation: [],
  shared: [],
  events: ['shared'],
  templates: ['shared'],
  components: ['shared', 'templates', 'events'],
  state: ['shared', 'events'],
  routing: ['shared', 'events'],
  cache: ['shared'],
  http: ['shared'],
  validation: ['shared'],
  animation: ['shared'],
  testing: ['shared']
};

class DependencyValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  validatePackage(pkgName) {
    const pkgPath = path.join(PACKAGES_DIR, pkgName);
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    
    if (!fs.existsSync(pkgJsonPath)) {
      this.warnings.push(`${pkgName}: No package.json found`);
      return;
    }
    
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const dependencies = pkgJson.dependencies || {};
    const allowed = ALLOWED_DEPENDENCIES[pkgName] || [];
    
    // Check each dependency
    Object.keys(dependencies).forEach(dep => {
      if (dep.startsWith('@brutal/')) {
        const depName = dep.replace('@brutal/', '');
        if (!allowed.includes(depName)) {
          this.violations.push({
            package: pkgName,
            dependency: depName,
            allowed: allowed
          });
        }
      } else {
        // External dependency - always a violation
        this.violations.push({
          package: pkgName,
          dependency: dep,
          type: 'external',
          allowed: []
        });
      }
    });
    
    // Check for missing dependencies (imports without package.json entry)
    this.checkImportsMatch(pkgName, dependencies);
  }
  
  checkImportsMatch(pkgName, declaredDeps) {
    const srcPath = path.join(PACKAGES_DIR, pkgName, 'src');
    if (!fs.existsSync(srcPath)) return;
    
    const imports = new Set();
    
    function scanFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const importMatches = content.matchAll(/from\s+['"]@brutal\/([^'"]+)['"]/g);
        for (const match of importMatches) {
          imports.add(match[1]);
        }
      } catch (e) {
        // Ignore
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
    
    // Check if all imports are declared
    imports.forEach(imp => {
      if (!declaredDeps[`@brutal/${imp}`]) {
        this.warnings.push(`${pkgName}: Imports @brutal/${imp} but not declared in package.json`);
      }
    });
  }
  
  generateReport() {
    console.log('\n📋 DEPENDENCY VALIDATION REPORT');
    console.log('==============================\n');
    
    if (this.violations.length === 0) {
      console.log('✅ All dependencies follow the strict graph!\n');
    } else {
      console.log(`❌ Found ${this.violations.length} dependency violations:\n`);
      
      this.violations.forEach(violation => {
        if (violation.type === 'external') {
          console.log(`  - ${violation.package}: External dependency '${violation.dependency}' (not allowed)`);
        } else {
          console.log(`  - ${violation.package}: Depends on '${violation.dependency}' (allowed: [${violation.allowed.join(', ')}])`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings:`);
      this.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
    console.log('\n📊 Expected dependency graph:');
    console.log('```');
    Object.entries(ALLOWED_DEPENDENCIES).forEach(([pkg, deps]) => {
      if (deps.length > 0) {
        console.log(`${pkg} → ${deps.join(', ')}`);
      } else {
        console.log(`${pkg} → (no dependencies)`);
      }
    });
    console.log('```');
    
    return this.violations.length === 0;
  }
}

// Main execution
const validator = new DependencyValidator();
const CORE_PACKAGES = Object.keys(ALLOWED_DEPENDENCIES);

console.log('🔗 Validating Package Dependencies...\n');

CORE_PACKAGES.forEach(pkg => {
  console.log(`📦 Checking @brutal/${pkg}...`);
  validator.validatePackage(pkg);
});

const isValid = validator.generateReport();

if (!isValid) {
  console.log('\n❌ Dependency validation failed!');
  console.log('Fix the violations before proceeding.\n');
  process.exit(1);
} else {
  console.log('\n✅ Dependency validation passed!\n');
}