/**
 * Runtime Version Guard
 * 
 * Embedded in each package to validate version compatibility at runtime.
 * Provides early detection of version mismatches before they cause errors.
 */

import { VersionManifest, VersionCompatibilitySystem } from './version-manifest';

export interface RuntimeGuardOptions {
  /**
   * Package name to validate
   */
  packageName: string;
  
  /**
   * Current package version
   */
  packageVersion: string;
  
  /**
   * Required dependencies
   */
  dependencies: Record<string, string>;
  
  /**
   * Validation mode
   */
  mode?: 'strict' | 'warn' | 'silent';
  
  /**
   * Custom error handler
   */
  onError?: (error: VersionError) => void;
  
  /**
   * Custom warning handler
   */
  onWarn?: (warning: VersionWarning) => void;
}

export interface VersionError {
  type: 'missing' | 'incompatible' | 'circular';
  package: string;
  dependency?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface VersionWarning {
  type: 'deprecated' | 'prerelease' | 'untested';
  package: string;
  message: string;
}

export class RuntimeVersionGuard {
  private static instance?: RuntimeVersionGuard;
  private static manifest?: VersionManifest;
  private static compatibilitySystem?: VersionCompatibilitySystem;
  private static validatedPackages = new Set<string>();
  private static installedVersions = new Map<string, string>();

  /**
   * Validates version compatibility at runtime
   */
  static validate(options: RuntimeGuardOptions): void {
    // Skip if already validated in this session
    const key = `${options.packageName}@${options.packageVersion}`;
    if (this.validatedPackages.has(key)) {
      return;
    }

    try {
      // Record this package version
      this.installedVersions.set(options.packageName, options.packageVersion);

      // Lazy load manifest
      if (!this.manifest) {
        this.loadManifest();
      }

      // Validate dependencies
      this.validateDependencies(options);

      // Mark as validated
      this.validatedPackages.add(key);

    } catch (error) {
      this.handleError(error as VersionError, options);
    }
  }

  /**
   * Loads the compatibility manifest
   */
  private static loadManifest(): void {
    // In production, this would be bundled or fetched
    // For now, we'll use a simplified embedded version
    this.manifest = this.getEmbeddedManifest();
    this.compatibilitySystem = new VersionCompatibilitySystem(this.manifest);
  }

  /**
   * Validates package dependencies
   */
  private static validateDependencies(options: RuntimeGuardOptions): void {
    const errors: VersionError[] = [];
    const warnings: VersionWarning[] = [];

    // Check each dependency
    for (const [depName, requiredVersion] of Object.entries(options.dependencies)) {
      const installedVersion = this.getInstalledVersion(depName);

      if (!installedVersion) {
        errors.push({
          type: 'missing',
          package: options.packageName,
          dependency: depName,
          expected: requiredVersion,
          message: `Required dependency ${depName} is not installed`
        });
        continue;
      }

      // Check compatibility
      if (!this.isCompatible(installedVersion, requiredVersion)) {
        errors.push({
          type: 'incompatible',
          package: options.packageName,
          dependency: depName,
          expected: requiredVersion,
          actual: installedVersion,
          message: `${depName}@${installedVersion} is incompatible with required ${requiredVersion}`
        });
      }

      // Check for warnings
      if (this.isPrerelease(installedVersion)) {
        warnings.push({
          type: 'prerelease',
          package: depName,
          message: `Using prerelease version ${installedVersion}`
        });
      }
    }

    // Handle errors and warnings
    if (errors.length > 0) {
      for (const error of errors) {
        this.handleError(error, options);
      }
    }

    if (warnings.length > 0) {
      for (const warning of warnings) {
        this.handleWarning(warning, options);
      }
    }
  }

  /**
   * Gets installed version of a package
   */
  private static getInstalledVersion(packageName: string): string | null {
    // First check our runtime cache
    if (this.installedVersions.has(packageName)) {
      return this.installedVersions.get(packageName)!;
    }

    // Try to get from loaded modules
    try {
      // In a real implementation, we'd check require.cache or import.meta
      // For now, we'll simulate with a version registry
      const version = this.getVersionFromRegistry(packageName);
      if (version) {
        this.installedVersions.set(packageName, version);
      }
      return version;
    } catch {
      return null;
    }
  }

  /**
   * Checks if versions are compatible
   */
  private static isCompatible(actual: string, required: string): boolean {
    // Simple compatibility check - in production use semver
    if (required === '*' || required === 'workspace:*') {
      return true;
    }

    if (required.startsWith('^')) {
      const base = required.substring(1);
      const [reqMajor] = base.split('.').map(Number);
      const [actMajor] = actual.split('.').map(Number);
      return reqMajor === actMajor;
    }

    if (required.startsWith('~')) {
      const base = required.substring(1);
      const [reqMajor, reqMinor] = base.split('.').map(Number);
      const [actMajor, actMinor] = actual.split('.').map(Number);
      return reqMajor === actMajor && reqMinor === actMinor;
    }

    return actual === required;
  }

  /**
   * Checks if version is prerelease
   */
  private static isPrerelease(version: string): boolean {
    return version.includes('alpha') || 
           version.includes('beta') || 
           version.includes('rc') ||
           version.includes('preview');
  }

  /**
   * Handles version errors
   */
  private static handleError(error: VersionError, options: RuntimeGuardOptions): void {
    // Custom handler
    if (options.onError) {
      options.onError(error);
      return;
    }

    // Default handling based on mode
    const mode = options.mode || 'warn';
    const prefix = `[BRUTAL Version Guard]`;

    switch (mode) {
      case 'strict':
        throw new Error(`${prefix} ${error.message}`);
      
      case 'warn':
        console.error(`${prefix} ❌ ${error.message}`);
        if (error.expected && error.actual) {
          console.error(`  Expected: ${error.expected}`);
          console.error(`  Actual: ${error.actual}`);
        }
        break;
      
      case 'silent':
        // Log to internal diagnostics only
        this.logDiagnostic('error', error);
        break;
    }
  }

  /**
   * Handles version warnings
   */
  private static handleWarning(warning: VersionWarning, options: RuntimeGuardOptions): void {
    // Custom handler
    if (options.onWarn) {
      options.onWarn(warning);
      return;
    }

    // Default handling based on mode
    const mode = options.mode || 'warn';
    
    if (mode === 'warn') {
      console.warn(`[BRUTAL Version Guard] ⚠️  ${warning.message}`);
    } else if (mode === 'silent') {
      this.logDiagnostic('warning', warning);
    }
  }

  /**
   * Logs diagnostic information
   */
  private static logDiagnostic(level: 'error' | 'warning', data: any): void {
    // In production, this would send to telemetry
    // For now, we'll store in memory
    if (!global.__brutalDiagnostics) {
      global.__brutalDiagnostics = [];
    }
    
    global.__brutalDiagnostics.push({
      timestamp: new Date(),
      level,
      data
    });
  }

  /**
   * Gets version from registry (simulated)
   */
  private static getVersionFromRegistry(packageName: string): string | null {
    // In production, this would check actual loaded modules
    // For simulation, return known versions
    const registry: Record<string, string> = {
      '@brutal/components': '1.0.0',
      '@brutal/state': '1.0.0',
      '@brutal/events': '1.0.0',
      '@brutal/shared': '1.0.0',
      '@brutal/foundation': '1.0.0',
      '@brutal/templates': '1.0.0'
    };
    
    return registry[packageName] || null;
  }

  /**
   * Gets embedded manifest (simplified for runtime)
   */
  private static getEmbeddedManifest(): VersionManifest {
    // In production, this would be generated at build time
    return {
      version: '1.0.0',
      generated: new Date(),
      packages: {
        '@brutal/components': {
          currentVersion: '1.0.0',
          supportedVersions: ['1.0.0'],
          dependencies: {
            '@brutal/foundation': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] },
            '@brutal/templates': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] },
            '@brutal/events': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] }
          }
        },
        '@brutal/enhanced-components': {
          currentVersion: '1.0.0',
          supportedVersions: ['1.0.0'],
          dependencies: {
            '@brutal/components': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] }
          }
        }
      },
      compatibility: {},
      breaking: [],
      validation: {
        strict: false,
        allowPrerelease: false,
        enforceAtRuntime: true
      }
    };
  }

  /**
   * Gets diagnostic report
   */
  static getDiagnostics(): any[] {
    return global.__brutalDiagnostics || [];
  }

  /**
   * Clears validation cache
   */
  static clearCache(): void {
    this.validatedPackages.clear();
    this.installedVersions.clear();
    global.__brutalDiagnostics = [];
  }
}

/**
 * Decorator for automatic validation
 */
export function validateVersions(options: Omit<RuntimeGuardOptions, 'packageName' | 'packageVersion'>) {
  return function (target: any) {
    const original = target;

    // Create wrapped class
    const wrapped = class extends original {
      constructor(...args: any[]) {
        // Validate before construction
        RuntimeVersionGuard.validate({
          packageName: target.__packageName || target.name,
          packageVersion: target.__packageVersion || '0.0.0',
          ...options
        });
        
        super(...args);
      }
    };

    // Preserve metadata
    Object.defineProperty(wrapped, 'name', { value: original.name });
    
    return wrapped;
  };
}

/**
 * Function to embed in each package
 */
export function createVersionGuard(
  packageName: string,
  packageVersion: string,
  dependencies: Record<string, string>
): () => void {
  return () => {
    RuntimeVersionGuard.validate({
      packageName,
      packageVersion,
      dependencies,
      mode: 'warn'
    });
  };
}

// Global type augmentation
declare global {
  var __brutalDiagnostics: any[];
}

// Export for use in packages
export default RuntimeVersionGuard;