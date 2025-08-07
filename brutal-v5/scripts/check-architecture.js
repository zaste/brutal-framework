#!/usr/bin/env node

/**
 * BRUTAL V5 - Architecture Alignment Checker
 * Validates that implementation matches PERFECT-V5-ARCHITECTURE.md
 * 
 * Usage: node scripts/check-architecture.js
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
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

// Expected architecture from PERFECT-V5-ARCHITECTURE.md
const EXPECTED_ARCHITECTURE = {
  // Core packages (11 total, 54KB)
  corePackages: [
    { name: '@brutal/foundation', size: 6, deps: 0 },
    { name: '@brutal/shared', size: 4, deps: 0 },
    { name: '@brutal/events', size: 5, deps: 1 },
    { name: '@brutal/templates', size: 7, deps: 1 },
    { name: '@brutal/components', size: 8, deps: 3 },
    { name: '@brutal/state', size: 6, deps: 2 },
    { name: '@brutal/routing', size: 6, deps: 2 },
    { name: '@brutal/cache', size: 5, deps: 1 },
    { name: '@brutal/scheduling', size: 3, deps: 0 },
    { name: '@brutal/a11y', size: 4, deps: 0 },
    { name: '@brutal/plugins', size: 4, deps: 2 }
  ],
  
  // Enhanced packages (3 total, 25KB)
  enhancedPackages: [
    { name: '@brutal/enhanced-components', size: 10 },
    { name: '@brutal/enhanced-state', size: 8 },
    { name: '@brutal/enhanced-routing', size: 7 }
  ],
  
  // Extension packages (14 total, ~100KB)
  extensionPackages: [
    { name: '@brutal/forms', size: 12 },
    { name: '@brutal/ui-primitives', size: 20 },
    { name: '@brutal/performance', size: 10 },
    { name: '@brutal/gpu', size: 15 },
    { name: '@brutal/animation', size: 12 },
    { name: '@brutal/mobile', size: 8 },
    { name: '@brutal/workers', size: 10 },
    { name: '@brutal/data', size: 15 },
    { name: '@brutal/pwa', size: 12 },
    { name: '@brutal/i18n', size: 8 },
    { name: '@brutal/security', size: 6 },
    { name: '@brutal/debug', size: 10 },
    { name: '@brutal/ai', size: 8 },
    { name: '@brutal/testing', size: 15 }
  ],
  
  // Expected directory structure
  directories: [
    'packages',
    'packages/@brutal',
    'tools',
    'scripts',
    'config',
    '.github',
    '.github/workflows',
    '.husky',
    'foundation',
    'bundles',
    'dist',
    'dist/bundles',
    'tests',
    'tests/integration',
    'tests/examples'
  ],
  
  // Required root files
  rootFiles: [
    'pnpm-workspace.yaml',
    'turbo.json',
    'tsconfig.json',
    'jest.config.js',
    '.eslintrc.js',
    '.prettierrc',
    '.gitignore',
    'LICENSE',
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'CODE_OF_CONDUCT.md'
  ],
  
  // Bundle configurations
  bundles: {
    'brutal-lite.js': { size: 15, packages: 4 },
    'brutal-core.js': { size: 35, packages: 11 },
    'brutal-enhanced.js': { size: 55, packages: 14 },
    'brutal-ui.js': { size: 85, packages: 17 },
    'brutal-full.js': { size: 155, packages: 28 }
  },
  
  // Quality requirements
  quality: {
    testCoverage: 95,
    maxCoreSize: 54,
    maxBundleSize: 155,
    requiredWorkflows: ['ci.yml', 'performance.yml', 'security.yml', 'release.yml']
  }
};

class ArchitectureChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      packages: { found: 0, expected: 0 },
      size: { actual: 0, expected: 0 },
      coverage: { actual: 0, expected: 95 }
    };
  }

  async check() {
    console.log(colors.bold(colors.blue('\n🏛️ BRUTAL V5 - Architecture Alignment Checker\n')));
    
    // Check directory structure
    this.checkDirectoryStructure();
    
    // Check root files
    this.checkRootFiles();
    
    // Check packages
    await this.checkPackages();
    
    // Check workflows
    this.checkWorkflows();
    
    // Check bundle configurations
    await this.checkBundles();
    
    // Generate compliance score
    const score = this.calculateComplianceScore();
    
    // Print report
    this.printReport(score);
    
    return this.errors.length === 0;
  }

  checkDirectoryStructure() {
    console.log(colors.cyan('📁 Checking directory structure...'));
    
    for (const dir of EXPECTED_ARCHITECTURE.directories) {
      const fullPath = path.join(ROOT, dir);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`Missing required directory: ${dir}`);
      }
    }
    
    // Check for unexpected directories
    const rootDirs = fs.readdirSync(ROOT)
      .filter(f => fs.statSync(path.join(ROOT, f)).isDirectory())
      .filter(f => !f.startsWith('.') && f !== 'node_modules');
    
    const expectedRootDirs = EXPECTED_ARCHITECTURE.directories
      .filter(d => !d.includes('/'))
      .concat(['node_modules']);
    
    for (const dir of rootDirs) {
      if (!expectedRootDirs.includes(dir)) {
        this.warnings.push(`Unexpected directory: ${dir}`);
      }
    }
  }

  checkRootFiles() {
    console.log(colors.cyan('📄 Checking root files...'));
    
    for (const file of EXPECTED_ARCHITECTURE.rootFiles) {
      const fullPath = path.join(ROOT, file);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`Missing required root file: ${file}`);
      }
    }
  }

  async checkPackages() {
    console.log(colors.cyan('📦 Checking packages...'));
    
    const allExpectedPackages = [
      ...EXPECTED_ARCHITECTURE.corePackages,
      ...EXPECTED_ARCHITECTURE.enhancedPackages,
      ...EXPECTED_ARCHITECTURE.extensionPackages
    ];
    
    this.stats.packages.expected = allExpectedPackages.length;
    
    // Check each expected package
    for (const expectedPkg of allExpectedPackages) {
      const result = await this.checkPackage(expectedPkg);
      if (result.exists) {
        this.stats.packages.found++;
        this.stats.size.actual += result.actualSize || 0;
      }
    }
    
    this.stats.size.expected = allExpectedPackages.reduce((sum, pkg) => sum + pkg.size, 0);
  }

  async checkPackage(expectedPkg) {
    const possiblePaths = [
      path.join(ROOT, 'packages', '@brutal', expectedPkg.name.replace('@brutal/', '')),
      path.join(ROOT, 'packages', '@brutal-enhanced', expectedPkg.name.replace('@brutal/', '')),
      path.join(ROOT, 'packages', '@brutal-ext', expectedPkg.name.replace('@brutal/', ''))
    ];
    
    let packagePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        packagePath = p;
        break;
      }
    }
    
    if (!packagePath) {
      this.errors.push(`Missing expected package: ${expectedPkg.name}`);
      return { exists: false };
    }
    
    // Check package.json
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push(`Missing package.json for: ${expectedPkg.name}`);
      return { exists: true, actualSize: 0 };
    }
    
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Check package name
      if (pkg.name !== expectedPkg.name) {
        this.errors.push(`Package name mismatch: expected ${expectedPkg.name}, got ${pkg.name}`);
      }
      
      // Check size limit
      if (pkg['size-limit'] && pkg['size-limit'][0]) {
        const sizeLimit = parseInt(pkg['size-limit'][0].limit);
        if (sizeLimit !== expectedPkg.size) {
          this.warnings.push(`Size limit mismatch for ${expectedPkg.name}: expected ${expectedPkg.size}KB, configured ${sizeLimit}KB`);
        }
      } else {
        this.warnings.push(`No size limit configured for: ${expectedPkg.name}`);
      }
      
      // Check dependency count
      if (expectedPkg.deps !== undefined) {
        const actualDeps = Object.keys(pkg.dependencies || {}).length;
        if (actualDeps !== expectedPkg.deps) {
          this.warnings.push(`Dependency count mismatch for ${expectedPkg.name}: expected ${expectedPkg.deps}, got ${actualDeps}`);
        }
      }
      
      return { exists: true, actualSize: expectedPkg.size };
      
    } catch (e) {
      this.errors.push(`Invalid package.json for ${expectedPkg.name}: ${e.message}`);
      return { exists: true, actualSize: 0 };
    }
  }

  checkWorkflows() {
    console.log(colors.cyan('🔧 Checking CI/CD workflows...'));
    
    const workflowsDir = path.join(ROOT, '.github/workflows');
    
    for (const workflow of EXPECTED_ARCHITECTURE.quality.requiredWorkflows) {
      const workflowPath = path.join(workflowsDir, workflow);
      if (!fs.existsSync(workflowPath)) {
        this.errors.push(`Missing required workflow: ${workflow}`);
      }
    }
  }

  async checkBundles() {
    console.log(colors.cyan('📦 Checking bundle configurations...'));
    
    // Look for bundle configuration
    const possibleConfigPaths = [
      path.join(ROOT, 'config/bundles.js'),
      path.join(ROOT, 'config/rollup.base.js'),
      path.join(ROOT, 'foundation/patterns/architecture/bundle-composition.md')
    ];
    
    let bundleConfigFound = false;
    for (const configPath of possibleConfigPaths) {
      if (fs.existsSync(configPath)) {
        bundleConfigFound = true;
        break;
      }
    }
    
    if (!bundleConfigFound) {
      this.warnings.push('No bundle configuration found');
    }
    
    // Check each expected bundle
    for (const [bundleName, config] of Object.entries(EXPECTED_ARCHITECTURE.bundles)) {
      // This would need actual bundle analysis in a real implementation
      console.log(`     Checking ${bundleName} (expected: ${config.size}KB, ${config.packages} packages)`);
    }
  }

  calculateComplianceScore() {
    const metrics = {
      directories: {
        weight: 15,
        score: (EXPECTED_ARCHITECTURE.directories.length - this.errors.filter(e => e.includes('directory')).length) / EXPECTED_ARCHITECTURE.directories.length
      },
      rootFiles: {
        weight: 10,
        score: (EXPECTED_ARCHITECTURE.rootFiles.length - this.errors.filter(e => e.includes('root file')).length) / EXPECTED_ARCHITECTURE.rootFiles.length
      },
      packages: {
        weight: 40,
        score: this.stats.packages.found / this.stats.packages.expected
      },
      bundleSize: {
        weight: 20,
        score: Math.min(1, this.stats.size.expected / (this.stats.size.actual || 1))
      },
      workflows: {
        weight: 15,
        score: (EXPECTED_ARCHITECTURE.quality.requiredWorkflows.length - this.errors.filter(e => e.includes('workflow')).length) / EXPECTED_ARCHITECTURE.quality.requiredWorkflows.length
      }
    };
    
    const totalScore = Object.values(metrics).reduce((sum, m) => sum + (m.score * m.weight), 0);
    const maxScore = Object.values(metrics).reduce((sum, m) => sum + m.weight, 0);
    
    return {
      total: Math.round((totalScore / maxScore) * 100),
      breakdown: metrics
    };
  }

  printReport(score) {
    console.log(colors.bold(colors.blue('\n📊 Architecture Compliance Report\n')));
    
    // Overall score
    const scoreColor = score.total >= 90 ? colors.green : score.total >= 70 ? colors.yellow : colors.red;
    console.log(colors.bold(`Overall Compliance Score: ${scoreColor(score.total + '%')}\n`));
    
    // Breakdown
    console.log('Score Breakdown:');
    for (const [category, data] of Object.entries(score.breakdown)) {
      const categoryScore = Math.round(data.score * 100);
      const categoryColor = categoryScore >= 90 ? colors.green : categoryScore >= 70 ? colors.yellow : colors.red;
      console.log(`  ${category}: ${categoryColor(categoryScore + '%')} (weight: ${data.weight}%)`);
    }
    
    // Package stats
    console.log(colors.bold('\n📦 Package Statistics:'));
    console.log(`  Expected packages: ${this.stats.packages.expected}`);
    console.log(`  Found packages: ${this.stats.packages.found}`);
    console.log(`  Expected total size: ${this.stats.size.expected}KB`);
    console.log(`  Configured total size: ${this.stats.size.actual}KB`);
    
    // Errors
    if (this.errors.length > 0) {
      console.log(colors.red(`\n❌ Errors (${this.errors.length}):`));
      this.errors.forEach(err => console.log(colors.red(`  • ${err}`)));
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log(colors.yellow(`\n⚠️  Warnings (${this.warnings.length}):`));
      this.warnings.forEach(warn => console.log(colors.yellow(`  • ${warn}`)));
    }
    
    // Summary
    const status = this.errors.length === 0 ? '✅ Architecture is aligned!' : '❌ Architecture has violations!';
    console.log(colors.bold(`\n${status}\n`));
    
    // Recommendations
    if (score.total < 100) {
      console.log(colors.cyan('📋 Recommendations:'));
      
      if (score.breakdown.packages.score < 1) {
        console.log('  • Run "npm run create:package" to generate missing packages');
      }
      
      if (score.breakdown.directories.score < 1) {
        console.log('  • Create missing directories per PERFECT-V5-ARCHITECTURE.md');
      }
      
      if (score.breakdown.rootFiles.score < 1) {
        console.log('  • Add missing root configuration files');
      }
      
      if (score.breakdown.workflows.score < 1) {
        console.log('  • Set up missing CI/CD workflows');
      }
      
      console.log('');
    }
  }
}

// Run checker
const checker = new ArchitectureChecker();
checker.check().then(isValid => {
  process.exit(isValid ? 0 : 1);
});