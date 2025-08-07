#!/usr/bin/env node
/**
 * Install-time Validator
 * 
 * Runs during npm/pnpm install to validate version compatibility
 * and warn about potential issues before they cause runtime errors.
 */

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VersionCompatibilitySystem, VersionManifest } from './version-manifest';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InstalledPackage {
  name: string;
  version: string;
  path: string;
}

export class InstallValidator {
  private manifestPath: string;
  private manifest?: VersionManifest;
  private compatibilitySystem?: VersionCompatibilitySystem;

  constructor(manifestPath?: string) {
    this.manifestPath = manifestPath || join(__dirname, 'compatibility-matrix.json');
  }

  /**
   * Main validation entry point
   */
  async validate(): Promise<void> {
    console.log('\n🔍 BRUTAL V5 - Checking version compatibility...\n');

    try {
      // Load manifest
      await this.loadManifest();

      // Discover installed packages
      const installed = await this.discoverInstalledPackages();
      
      if (installed.size === 0) {
        console.log('ℹ️  No @brutal packages found. Skipping validation.\n');
        return;
      }

      // Validate compatibility
      const packages = Object.fromEntries(installed);
      const result = this.compatibilitySystem!.validateCompatibility(packages);

      // Display results
      this.displayResults(result, installed);

      // Exit with error if strict mode and issues found
      if (!result.valid && this.manifest!.validation.strict) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error during validation:', error);
      console.error('\n⚠️  Skipping compatibility check due to error.\n');
      // Don't fail install on validator errors
    }
  }

  /**
   * Loads the compatibility manifest
   */
  private async loadManifest(): Promise<void> {
    try {
      const content = await readFile(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);
      this.compatibilitySystem = new VersionCompatibilitySystem(this.manifest!);
    } catch (error) {
      throw new Error(`Failed to load compatibility manifest: ${error}`);
    }
  }

  /**
   * Discovers installed @brutal packages
   */
  private async discoverInstalledPackages(): Promise<Map<string, string>> {
    const installed = new Map<string, string>();
    
    // Check node_modules
    const nodeModulesPath = await this.findNodeModules();
    if (!nodeModulesPath) {
      console.warn('⚠️  Could not find node_modules directory');
      return installed;
    }

    // Look for @brutal packages
    const brutalPath = join(nodeModulesPath, '@brutal');
    
    try {
      await access(brutalPath);
    } catch {
      // No @brutal packages installed yet
      return installed;
    }

    // Read package.json for each package
    const { readdir } = await import('fs/promises');
    const packages = await readdir(brutalPath);

    for (const pkgName of packages) {
      try {
        const pkgJsonPath = join(brutalPath, pkgName, 'package.json');
        const content = await readFile(pkgJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        
        installed.set(pkg.name, pkg.version);
        console.log(`  ✓ Found ${pkg.name}@${pkg.version}`);
      } catch {
        // Skip invalid packages
      }
    }

    return installed;
  }

  /**
   * Finds the nearest node_modules directory
   */
  private async findNodeModules(): Promise<string | null> {
    let currentDir = process.cwd();
    
    while (currentDir !== '/') {
      const nodeModulesPath = join(currentDir, 'node_modules');
      
      try {
        await access(nodeModulesPath);
        return nodeModulesPath;
      } catch {
        // Continue searching up
      }
      
      currentDir = dirname(currentDir);
    }
    
    return null;
  }

  /**
   * Displays validation results
   */
  private displayResults(
    result: ReturnType<VersionCompatibilitySystem['validateCompatibility']>,
    installed: Map<string, string>
  ): void {
    console.log('\n📊 Compatibility Check Results:');
    console.log('─'.repeat(50));

    // Show installed packages
    console.log('\n📦 Installed packages:');
    for (const [name, version] of installed) {
      console.log(`   ${name}@${version}`);
    }

    // Show warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`   - ${warning.message}`);
      }
    }

    // Show issues
    if (result.issues.length > 0) {
      console.log('\n❌ Compatibility Issues:');
      for (const issue of result.issues) {
        console.log(`\n   ${issue.package}:`);
        console.log(`   - ${issue.message}`);
        
        if (issue.type === 'incompatible-version' && issue.expected) {
          console.log(`   - Expected: ${issue.expected.min} - ${issue.expected.max}`);
          console.log(`   - Actual: ${issue.actual}`);
        }
      }
    }

    // Show suggestions
    if (result.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      for (const suggestion of result.suggestions) {
        console.log(`   - Install ${suggestion.package}@${suggestion.suggestedVersion}`);
        console.log(`     Reason: ${suggestion.reason}`);
      }

      // Generate install command
      const installCmd = this.generateInstallCommand(result.suggestions);
      if (installCmd) {
        console.log(`\n📋 To fix, run:`);
        console.log(`   ${installCmd}`);
      }
    }

    // Final status
    console.log('\n' + '─'.repeat(50));
    if (result.valid) {
      console.log('✅ All packages are compatible!\n');
    } else {
      console.log('❌ Compatibility issues detected!\n');
      
      if (this.manifest!.validation.strict) {
        console.log('🚫 Installation blocked due to strict validation mode.');
        console.log('   Fix the issues above or disable strict mode.\n');
      } else {
        console.log('⚠️  Proceeding with installation despite issues.');
        console.log('   Fix the compatibility issues to avoid runtime errors.\n');
      }
    }
  }

  /**
   * Generates install command for suggested versions
   */
  private generateInstallCommand(
    suggestions: Array<{ package: string; suggestedVersion: string }>
  ): string | null {
    if (suggestions.length === 0) return null;

    const packages = suggestions
      .map(s => `${s.package}@${s.suggestedVersion}`)
      .join(' ');

    // Detect package manager
    const userAgent = process.env.npm_config_user_agent || '';
    
    if (userAgent.includes('pnpm')) {
      return `pnpm add ${packages}`;
    } else if (userAgent.includes('yarn')) {
      return `yarn add ${packages}`;
    } else {
      return `npm install ${packages}`;
    }
  }

  /**
   * Hook installer - adds this validator to package.json scripts
   */
  static async installHook(): Promise<void> {
    console.log('📝 Installing BRUTAL compatibility validator hook...');
    
    try {
      const pkgJsonPath = join(process.cwd(), 'package.json');
      const content = await readFile(pkgJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      // Add to scripts
      pkg.scripts = pkg.scripts || {};
      
      // Add preinstall hook
      if (!pkg.scripts.preinstall) {
        pkg.scripts.preinstall = 'brutal-validate-compatibility';
      } else if (!pkg.scripts.preinstall.includes('brutal-validate-compatibility')) {
        pkg.scripts.preinstall = `${pkg.scripts.preinstall} && brutal-validate-compatibility`;
      }

      // Add postinstall hook
      if (!pkg.scripts.postinstall) {
        pkg.scripts.postinstall = 'brutal-validate-compatibility';
      } else if (!pkg.scripts.postinstall.includes('brutal-validate-compatibility')) {
        pkg.scripts.postinstall = `${pkg.scripts.postinstall} && brutal-validate-compatibility`;
      }

      // Save updated package.json
      const { writeFile } = await import('fs/promises');
      await writeFile(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');

      console.log('✅ Compatibility validator hook installed!');
      console.log('   - Added to preinstall script');
      console.log('   - Added to postinstall script');
      console.log('\n📋 To remove, delete the hooks from package.json scripts.');

    } catch (error) {
      console.error('❌ Failed to install hook:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--install-hook')) {
    InstallValidator.installHook();
  } else {
    const validator = new InstallValidator();
    validator.validate();
  }
}

// Also run if executed via npx or npm scripts
if (process.env.npm_lifecycle_event === 'preinstall' || 
    process.env.npm_lifecycle_event === 'postinstall') {
  const validator = new InstallValidator();
  validator.validate();
}