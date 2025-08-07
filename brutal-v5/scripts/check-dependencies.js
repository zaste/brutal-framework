#!/usr/bin/env node

/**
 * BRUTAL V5 - Dependency Graph Validator
 * Ensures packages only depend on allowed dependencies per PERFECT-V5-ARCHITECTURE.md
 * 
 * Usage: node scripts/check-dependencies.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Color helpers
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

// Official dependency graph from PERFECT-V5-ARCHITECTURE.md
const DEPENDENCY_GRAPH = {
  // Core packages - Stage 1 (no dependencies)
  '@brutal/foundation': [],
  '@brutal/shared': [],
  '@brutal/scheduling': [],
  '@brutal/a11y': [],
  
  // Core packages - Stage 2 (single dependencies)
  '@brutal/events': ['@brutal/shared'],
  '@brutal/templates': ['@brutal/shared'],
  '@brutal/cache': ['@brutal/shared'],
  
  // Core packages - Stage 3 (multiple dependencies)
  '@brutal/components': ['@brutal/foundation', '@brutal/templates', '@brutal/events'],
  '@brutal/state': ['@brutal/shared', '@brutal/events'],
  '@brutal/routing': ['@brutal/events', '@brutal/shared'],
  '@brutal/plugins': ['@brutal/events', '@brutal/shared'],
  
  // Enhanced packages
  '@brutal/enhanced-components': ['@brutal/components'],
  '@brutal/enhanced-state': ['@brutal/state'],
  '@brutal/enhanced-routing': ['@brutal/routing'],
  
  // Extension packages (examples)
  '@brutal/forms': ['@brutal/components', '@brutal/state'],
  '@brutal/ui-primitives': ['@brutal/components', '@brutal/templates'],
  '@brutal/animation': ['@brutal/scheduling', '@brutal/shared'],
  '@brutal/gpu': ['@brutal/shared'],
  '@brutal/workers': ['@brutal/shared'],
  '@brutal/data': ['@brutal/state', '@brutal/components'],
  '@brutal/pwa': ['@brutal/cache', '@brutal/routing'],
  '@brutal/i18n': ['@brutal/shared'],
  '@brutal/security': ['@brutal/shared'],
  '@brutal/debug': ['@brutal/components', '@brutal/state'],
  '@brutal/ai': ['@brutal/shared'],
  '@brutal/testing': ['@brutal/components', '@brutal/state', '@brutal/events'],
  '@brutal/performance': ['@brutal/scheduling', '@brutal/shared'],
  '@brutal/mobile': ['@brutal/components', '@brutal/events']
};

class DependencyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.packages = new Map();
    this.circularDeps = [];
  }

  async validate() {
    console.log(colors.bold(colors.blue('\n🔗 BRUTAL V5 - Dependency Validator\n')));

    // Load all packages
    await this.loadPackages();

    if (this.packages.size === 0) {
      console.error(colors.red('❌ No packages found!'));
      return false;
    }

    // Validate each package
    let isValid = true;
    for (const [name, pkg] of this.packages) {
      if (!this.validatePackage(name, pkg)) {
        isValid = false;
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies();

    // Check build order
    this.validateBuildOrder();

    // Print summary
    this.printSummary();

    return isValid && this.circularDeps.length === 0;
  }

  async loadPackages() {
    const packagesDir = path.join(ROOT, 'packages');
    
    // Helper to scan directory
    const scanDir = (dir, prefix = '') => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          const packageJsonPath = path.join(itemPath, 'package.json');
          
          if (fs.existsSync(packageJsonPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
              this.packages.set(pkg.name, {
                path: itemPath,
                packageJson: pkg,
                dependencies: pkg.dependencies || {}
              });
            } catch (e) {
              this.errors.push({
                package: prefix + item,
                error: `Invalid package.json: ${e.message}`
              });
            }
          }
        }
      }
    };

    // Scan all package locations
    scanDir(path.join(packagesDir, '@brutal'), '@brutal/');
    scanDir(path.join(packagesDir, '@brutal-enhanced'), '@brutal-enhanced/');
    scanDir(path.join(packagesDir, '@brutal-ext'), '@brutal-ext/');
  }

  validatePackage(name, pkg) {
    console.log(`\n📦 Validating dependencies for ${name}...`);

    const allowedDeps = DEPENDENCY_GRAPH[name];
    const actualDeps = Object.keys(pkg.dependencies);
    
    // Unknown package - check if it's allowed to exist
    if (allowedDeps === undefined) {
      this.warnings.push({
        package: name,
        warning: 'Package not in official dependency graph'
      });
      
      // Still check for external dependencies
      for (const dep of actualDeps) {
        if (!dep.startsWith('@brutal/')) {
          this.errors.push({
            package: name,
            error: `External dependency not allowed: ${dep}`
          });
          return false;
        }
      }
      
      return true;
    }

    // Check for unauthorized dependencies
    const unauthorized = [];
    const external = [];
    
    for (const dep of actualDeps) {
      if (!dep.startsWith('@brutal/')) {
        external.push(dep);
      } else if (!allowedDeps.includes(dep)) {
        unauthorized.push(dep);
      }
    }

    // Check for missing required dependencies
    const missing = [];
    for (const dep of allowedDeps) {
      if (!actualDeps.includes(dep)) {
        missing.push(dep);
      }
    }

    // Report errors
    let hasErrors = false;
    
    if (external.length > 0) {
      this.errors.push({
        package: name,
        error: `External dependencies not allowed: ${external.join(', ')}`
      });
      hasErrors = true;
    }

    if (unauthorized.length > 0) {
      this.errors.push({
        package: name,
        error: `Unauthorized dependencies: ${unauthorized.join(', ')}`
      });
      hasErrors = true;
    }

    if (missing.length > 0) {
      this.warnings.push({
        package: name,
        warning: `Missing expected dependencies: ${missing.join(', ')}`
      });
    }

    if (!hasErrors) {
      console.log(colors.green('  ✅ Dependencies valid'));
    } else {
      console.log(colors.red(`  ❌ ${external.length + unauthorized.length} dependency violations`));
    }

    return !hasErrors;
  }

  checkCircularDependencies() {
    console.log('\n🔄 Checking for circular dependencies...');

    const visited = new Set();
    const recursionStack = new Set();

    const detectCycle = (pkg, path = []) => {
      if (recursionStack.has(pkg)) {
        const cycleStart = path.indexOf(pkg);
        const cycle = [...path.slice(cycleStart), pkg];
        this.circularDeps.push(cycle);
        return true;
      }

      if (visited.has(pkg)) {
        return false;
      }

      visited.add(pkg);
      recursionStack.add(pkg);
      path.push(pkg);

      const deps = DEPENDENCY_GRAPH[pkg] || [];
      for (const dep of deps) {
        detectCycle(dep, [...path]);
      }

      recursionStack.delete(pkg);
      return false;
    };

    // Check each package
    for (const pkg of Object.keys(DEPENDENCY_GRAPH)) {
      if (!visited.has(pkg)) {
        detectCycle(pkg);
      }
    }

    if (this.circularDeps.length === 0) {
      console.log(colors.green('  ✅ No circular dependencies found'));
    } else {
      console.log(colors.red(`  ❌ Found ${this.circularDeps.length} circular dependencies:`));
      for (const cycle of this.circularDeps) {
        console.log(colors.red(`     ${cycle.join(' → ')}`));
      }
    }
  }

  validateBuildOrder() {
    console.log('\n📋 Validating build order...');

    // Topological sort
    const inDegree = new Map();
    const adjList = new Map();

    // Initialize
    for (const pkg of Object.keys(DEPENDENCY_GRAPH)) {
      inDegree.set(pkg, 0);
      adjList.set(pkg, []);
    }

    // Build graph
    for (const [pkg, deps] of Object.entries(DEPENDENCY_GRAPH)) {
      for (const dep of deps) {
        if (!adjList.has(dep)) {
          adjList.set(dep, []);
        }
        adjList.get(dep).push(pkg);
        inDegree.set(pkg, (inDegree.get(pkg) || 0) + 1);
      }
    }

    // Find build order
    const queue = [];
    const buildOrder = [];

    for (const [pkg, degree] of inDegree) {
      if (degree === 0) {
        queue.push(pkg);
      }
    }

    while (queue.length > 0) {
      const pkg = queue.shift();
      buildOrder.push(pkg);

      for (const dependent of (adjList.get(pkg) || [])) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      }
    }

    if (buildOrder.length !== Object.keys(DEPENDENCY_GRAPH).length) {
      console.log(colors.red('  ❌ Cannot determine valid build order (circular dependencies?)'));
    } else {
      console.log(colors.green('  ✅ Valid build order determined:'));
      
      // Group by stages
      const stages = [];
      let currentStage = [];
      let currentDeps = 0;

      for (const pkg of buildOrder) {
        const deps = DEPENDENCY_GRAPH[pkg].length;
        if (deps !== currentDeps && currentStage.length > 0) {
          stages.push(currentStage);
          currentStage = [];
          currentDeps = deps;
        }
        currentStage.push(pkg);
      }
      
      if (currentStage.length > 0) {
        stages.push(currentStage);
      }

      stages.forEach((stage, i) => {
        console.log(`\n     Stage ${i + 1}: ${stage.join(', ')}`);
      });
    }
  }

  printSummary() {
    console.log(colors.bold(colors.blue('\n📊 Dependency Validation Summary\n')));

    console.log(`Total packages analyzed: ${this.packages.size}`);
    console.log(`Packages in dependency graph: ${Object.keys(DEPENDENCY_GRAPH).length}`);

    if (this.errors.length > 0) {
      console.log(colors.red(`\n❌ Errors found: ${this.errors.length}`));
      for (const { package: pkg, error } of this.errors) {
        console.log(colors.red(`   ${pkg}: ${error}`));
      }
    }

    if (this.warnings.length > 0) {
      console.log(colors.yellow(`\n⚠️  Warnings: ${this.warnings.length}`));
      for (const { package: pkg, warning } of this.warnings) {
        console.log(colors.yellow(`   ${pkg}: ${warning}`));
      }
    }

    if (this.circularDeps.length > 0) {
      console.log(colors.red(`\n🔄 Circular dependencies: ${this.circularDeps.length}`));
    }

    const isValid = this.errors.length === 0 && this.circularDeps.length === 0;
    console.log(colors.bold(`\n${isValid ? '✅ All dependency checks passed!' : '❌ Dependency validation failed!'}\n`));

    return isValid;
  }
}

// Run validation
const validator = new DependencyValidator();
validator.validate().then(isValid => {
  process.exit(isValid ? 0 : 1);
});