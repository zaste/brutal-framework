#!/usr/bin/env node

/**
 * BRUTAL V5 - Package Structure Validator
 * Validates all packages against PERFECT-V5-ARCHITECTURE.md
 * 
 * Usage: 
 *   node scripts/validate-structure.js              # Validate all packages
 *   node scripts/validate-structure.js [package]    # Validate specific package
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

// Color helpers (no external deps)
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

// Required structure from PERFECT-V5-ARCHITECTURE.md
const REQUIRED_STRUCTURE = {
  directories: [
    'src',
    'tests',
    'tests/fixtures',
    'tests/integration',
    'tests/performance',
    'types',
    'docs',
    'examples'
  ],
  files: [
    'src/index.ts',
    'src/index.test.ts',
    'src/types.ts',
    'src/constants.ts',
    'tests/setup.ts',
    'types/index.d.ts',
    'types/global.d.ts',
    'types/internal.d.ts',
    'docs/README.md',
    'docs/API.md',
    'docs/EXAMPLES.md',
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    '.eslintrc.js',
    '.npmignore',
    'CHANGELOG.md',
    'LICENSE'
  ],
  patterns: {
    // Every feature must be in a subdirectory
    featureStructure: /^src\/[^\/]+\/[^\/]+\.ts$/,
    // Every .ts file must have a .test.ts file
    testCoverage: /\.test\.ts$/,
    // No test files in separate __tests__ directories
    noSeparateTests: /__tests__/
  }
};

// Package-specific requirements
const PACKAGE_REQUIREMENTS = {
  '@brutal/foundation': {
    requiredExports: ['polyfillStrategy', 'registry', 'configLoader', 'constants', 'envProfiles']
  },
  '@brutal/shared': {
    requiredSubdirs: ['sanitizer', 'errors', 'dom', 'utils', 'types']
  },
  '@brutal/components': {
    requiredSubdirs: ['base', 'lifecycle', 'error-boundary', 'hooks', 'registry']
  }
};

class StructureValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalPackages: 0,
      validPackages: 0,
      totalFiles: 0,
      totalTests: 0,
      coverage: {}
    };
  }

  validateAll() {
    console.log(colors.bold(colors.blue('\n🔍 BRUTAL V5 - Structure Validator\n')));

    const packages = this.findPackages();
    
    if (packages.length === 0) {
      console.error(colors.red('❌ No packages found!'));
      return false;
    }

    let allValid = true;

    for (const pkg of packages) {
      const isValid = this.validatePackage(pkg);
      if (!isValid) allValid = false;
    }

    this.printSummary();
    return allValid;
  }

  validatePackage(packagePath) {
    const packageName = this.getPackageName(packagePath);
    this.stats.totalPackages++;

    console.log(colors.bold(`\n📦 Validating ${packageName}...`));

    const errors = [];
    const warnings = [];

    // Check required directories
    for (const dir of REQUIRED_STRUCTURE.directories) {
      const dirPath = path.join(packagePath, dir);
      if (!fs.existsSync(dirPath)) {
        errors.push(`Missing required directory: ${dir}/`);
      }
    }

    // Check required files
    for (const file of REQUIRED_STRUCTURE.files) {
      const filePath = path.join(packagePath, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing required file: ${file}`);
      }
    }

    // Validate src/ structure
    const srcErrors = this.validateSrcStructure(packagePath);
    errors.push(...srcErrors);

    // Validate test coverage
    const testWarnings = this.validateTestCoverage(packagePath);
    warnings.push(...testWarnings);

    // Validate package.json
    const packageJsonErrors = this.validatePackageJson(packagePath);
    errors.push(...packageJsonErrors);

    // Check for anti-patterns
    const antiPatternErrors = this.checkAntiPatterns(packagePath);
    errors.push(...antiPatternErrors);

    // Package-specific validation
    const specificErrors = this.validatePackageSpecific(packagePath, packageName);
    errors.push(...specificErrors);

    // Print results
    if (errors.length === 0 && warnings.length === 0) {
      console.log(colors.green('  ✅ Structure is perfect!'));
      this.stats.validPackages++;
      return true;
    }

    if (errors.length > 0) {
      console.log(colors.red(`\n  ❌ ${errors.length} errors found:`));
      errors.forEach(err => console.log(colors.red(`     • ${err}`)));
      this.errors.push({ package: packageName, errors });
    }

    if (warnings.length > 0) {
      console.log(colors.yellow(`\n  ⚠️  ${warnings.length} warnings:`));
      warnings.forEach(warn => console.log(colors.yellow(`     • ${warn}`)));
      this.warnings.push({ package: packageName, warnings });
    }

    return errors.length === 0;
  }

  validateSrcStructure(packagePath) {
    const errors = [];
    const srcPath = path.join(packagePath, 'src');

    if (!fs.existsSync(srcPath)) return errors;

    const files = this.getAllFiles(srcPath);
    const sourceFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    
    // Check that features are in subdirectories
    let hasFeatureSubdirs = false;
    for (const file of sourceFiles) {
      const relativePath = path.relative(srcPath, file);
      if (relativePath.includes('/') && !relativePath.startsWith('index')) {
        hasFeatureSubdirs = true;
        break;
      }
    }

    if (!hasFeatureSubdirs && sourceFiles.length > 4) {
      errors.push('Features must be organized in subdirectories (not flat structure)');
    }

    // Validate each source file has a test
    for (const sourceFile of sourceFiles) {
      const testFile = sourceFile.replace('.ts', '.test.ts');
      if (!fs.existsSync(testFile)) {
        const relative = path.relative(packagePath, sourceFile);
        errors.push(`Missing test file for: ${relative}`);
      }
    }

    return errors;
  }

  validateTestCoverage(packagePath) {
    const warnings = [];
    const srcPath = path.join(packagePath, 'src');

    if (!fs.existsSync(srcPath)) return warnings;

    const files = this.getAllFiles(srcPath);
    const sourceFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    const testFiles = files.filter(f => f.endsWith('.test.ts'));

    this.stats.totalFiles += sourceFiles.length;
    this.stats.totalTests += testFiles.length;

    const fileCoverage = (testFiles.length / sourceFiles.length) * 100;
    const packageName = this.getPackageName(packagePath);
    this.stats.coverage[packageName] = fileCoverage;

    if (fileCoverage < 100) {
      warnings.push(`Test file coverage: ${fileCoverage.toFixed(1)}% (should be 100%)`);
    }

    // Check for actual code coverage if available
    const coveragePath = path.join(packagePath, 'coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      const total = coverage.total;
      
      if (total.lines.pct < 95) {
        warnings.push(`Code line coverage: ${total.lines.pct}% (should be >= 95%)`);
      }
      if (total.branches.pct < 95) {
        warnings.push(`Code branch coverage: ${total.branches.pct}% (should be >= 95%)`);
      }
    }

    return warnings;
  }

  validatePackageJson(packagePath) {
    const errors = [];
    const packageJsonPath = path.join(packagePath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return ['Missing package.json'];
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Required fields
      const required = ['name', 'version', 'type', 'main', 'module', 'types', 'exports', 'files', 'scripts'];
      for (const field of required) {
        if (!packageJson[field]) {
          errors.push(`package.json missing required field: ${field}`);
        }
      }

      // Validate exports
      if (packageJson.exports && packageJson.exports['.']) {
        const exp = packageJson.exports['.'];
        if (!exp.types || !exp.import) {
          errors.push('package.json exports missing types or import');
        }
      }

      // Validate scripts
      const requiredScripts = ['build', 'test', 'lint', 'type-check', 'size'];
      if (packageJson.scripts) {
        for (const script of requiredScripts) {
          if (!packageJson.scripts[script]) {
            errors.push(`package.json missing required script: ${script}`);
          }
        }
      }

      // Validate size-limit
      if (!packageJson['size-limit']) {
        errors.push('package.json missing size-limit configuration');
      }

      // Check dependencies
      if (packageJson.dependencies) {
        const deps = Object.keys(packageJson.dependencies);
        for (const dep of deps) {
          if (!dep.startsWith('@brutal/')) {
            errors.push(`External dependency not allowed: ${dep}`);
          }
        }
      }

    } catch (e) {
      errors.push(`Invalid package.json: ${e.message}`);
    }

    return errors;
  }

  checkAntiPatterns(packagePath) {
    const errors = [];
    const files = this.getAllFiles(packagePath);

    for (const file of files) {
      const relative = path.relative(packagePath, file);

      // No __tests__ directories
      if (relative.includes('__tests__')) {
        errors.push(`Anti-pattern: separate test directory found: ${relative}`);
      }

      // No .spec.ts files (should be .test.ts)
      if (relative.endsWith('.spec.ts')) {
        errors.push(`Anti-pattern: use .test.ts not .spec.ts: ${relative}`);
      }

      // No .js files except config files
      if (relative.endsWith('.js') && 
          !relative.endsWith('jest.config.js') && 
          !relative.endsWith('.eslintrc.js') &&
          !relative.endsWith('rollup.config.js') &&
          !relative.includes('node_modules') &&
          !relative.includes('dist/')) {
        errors.push(`Anti-pattern: JavaScript file found (should be TypeScript): ${relative}`);
      }
    }

    return errors;
  }

  validatePackageSpecific(packagePath, packageName) {
    const errors = [];
    const requirements = PACKAGE_REQUIREMENTS[packageName];

    if (!requirements) return errors;

    // Check required subdirectories
    if (requirements.requiredSubdirs) {
      for (const subdir of requirements.requiredSubdirs) {
        const subdirPath = path.join(packagePath, 'src', subdir);
        if (!fs.existsSync(subdirPath)) {
          errors.push(`Missing required subdirectory for ${packageName}: src/${subdir}/`);
        }
      }
    }

    // Check required exports
    if (requirements.requiredExports) {
      const indexPath = path.join(packagePath, 'src/index.ts');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        for (const exp of requirements.requiredExports) {
          if (!content.includes(`export`) || !content.includes(exp)) {
            errors.push(`Missing required export for ${packageName}: ${exp}`);
          }
        }
      }
    }

    return errors;
  }

  findPackages() {
    const packages = [];

    // Find all @brutal packages
    const brutalDir = path.join(PACKAGES_DIR, '@brutal');
    if (fs.existsSync(brutalDir)) {
      const dirs = fs.readdirSync(brutalDir)
        .filter(d => fs.statSync(path.join(brutalDir, d)).isDirectory());
      
      dirs.forEach(dir => {
        packages.push(path.join(brutalDir, dir));
      });
    }

    // Find enhanced packages
    const enhancedDir = path.join(PACKAGES_DIR, '@brutal-enhanced');
    if (fs.existsSync(enhancedDir)) {
      const dirs = fs.readdirSync(enhancedDir)
        .filter(d => fs.statSync(path.join(enhancedDir, d)).isDirectory());
      
      dirs.forEach(dir => {
        packages.push(path.join(enhancedDir, dir));
      });
    }

    // Find extension packages
    const extDir = path.join(PACKAGES_DIR, '@brutal-ext');
    if (fs.existsSync(extDir)) {
      const dirs = fs.readdirSync(extDir)
        .filter(d => fs.statSync(path.join(extDir, d)).isDirectory());
      
      dirs.forEach(dir => {
        packages.push(path.join(extDir, dir));
      });
    }

    return packages;
  }

  getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.getAllFiles(fullPath, files);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  getPackageName(packagePath) {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return pkg.name || path.basename(packagePath);
      } catch (e) {
        // Fallback to directory name
      }
    }
    return path.basename(packagePath);
  }

  printSummary() {
    console.log(colors.bold(colors.blue('\n📊 Validation Summary\n')));

    console.log(`Total packages scanned: ${this.stats.totalPackages}`);
    console.log(colors.green(`Valid packages: ${this.stats.validPackages}`));
    console.log(colors.red(`Invalid packages: ${this.stats.totalPackages - this.stats.validPackages}`));

    if (this.stats.totalFiles > 0) {
      const avgCoverage = (this.stats.totalTests / this.stats.totalFiles) * 100;
      console.log(`\nAverage test coverage: ${avgCoverage.toFixed(1)}%`);
    }

    if (this.errors.length > 0) {
      console.log(colors.red(`\n❌ Total errors: ${this.errors.reduce((sum, e) => sum + e.errors.length, 0)}`));
    }

    if (this.warnings.length > 0) {
      console.log(colors.yellow(`⚠️  Total warnings: ${this.warnings.reduce((sum, w) => sum + w.warnings.length, 0)}`));
    }

    // Exit code
    const exitCode = this.errors.length > 0 ? 1 : 0;
    console.log(colors.bold(`\n${exitCode === 0 ? '✅ All checks passed!' : '❌ Validation failed!'}\n`));
    
    return exitCode;
  }
}

// Run validation
const validator = new StructureValidator();
const args = process.argv.slice(2);

if (args.length > 0) {
  // Validate specific package
  const packagePath = path.resolve(args[0]);
  const isValid = validator.validatePackage(packagePath);
  process.exit(isValid ? 0 : 1);
} else {
  // Validate all packages
  const isValid = validator.validateAll();
  process.exit(isValid ? 0 : 1);
}