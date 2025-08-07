/**
 * Version Compatibility System for BRUTAL V5
 * 
 * Prevents version mismatch chaos across 42 packages by maintaining
 * a central manifest of compatible versions and validating at both
 * install time and runtime.
 */

export interface VersionRange {
  min: string;
  max: string;
  tested: string[];
  breaking?: string[];
}

export interface CompatibilityMatrix {
  [packageName: string]: {
    [version: string]: {
      compatible: Record<string, VersionRange>;
      incompatible?: Record<string, string[]>;
      notes?: string;
    };
  };
}

export interface BreakingChange {
  package: string;
  fromVersion: string;
  toVersion: string;
  changes: string[];
  migrationGuide?: string;
  codemod?: string;
}

export interface VersionManifest {
  version: string;
  generated: Date;
  packages: Record<string, {
    currentVersion: string;
    supportedVersions: string[];
    dependencies: Record<string, VersionRange>;
  }>;
  compatibility: CompatibilityMatrix;
  breaking: BreakingChange[];
  validation: {
    strict: boolean;
    allowPrerelease: boolean;
    enforceAtRuntime: boolean;
  };
}

export class VersionCompatibilitySystem {
  private manifest: VersionManifest;

  constructor(manifest: VersionManifest) {
    this.manifest = manifest;
  }

  /**
   * Validates if a set of package versions are compatible
   */
  validateCompatibility(
    packages: Record<string, string>
  ): ValidationResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];

    // Check each package against its dependencies
    for (const [pkgName, pkgVersion] of Object.entries(packages)) {
      const pkgManifest = this.manifest.packages[pkgName];
      
      if (!pkgManifest) {
        warnings.push({
          type: 'unknown-package',
          package: pkgName,
          message: `Package ${pkgName} not found in manifest`
        });
        continue;
      }

      // Check dependencies
      for (const [depName, depRange] of Object.entries(pkgManifest.dependencies)) {
        const installedDepVersion = packages[depName];
        
        if (!installedDepVersion) {
          issues.push({
            type: 'missing-dependency',
            package: pkgName,
            dependency: depName,
            message: `${pkgName}@${pkgVersion} requires ${depName}`
          });
          continue;
        }

        if (!this.isVersionInRange(installedDepVersion, depRange)) {
          issues.push({
            type: 'incompatible-version',
            package: pkgName,
            dependency: depName,
            expected: depRange,
            actual: installedDepVersion,
            message: `${pkgName}@${pkgVersion} requires ${depName}@${depRange.min}-${depRange.max}, but ${installedDepVersion} is installed`
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      suggestions: this.generateSuggestions(issues)
    };
  }

  /**
   * Checks if a version is within a range
   */
  private isVersionInRange(version: string, range: VersionRange): boolean {
    // Simple version comparison - in real implementation use semver
    const v = this.parseVersion(version);
    const min = this.parseVersion(range.min);
    const max = this.parseVersion(range.max);

    return this.compareVersions(v, min) >= 0 && 
           this.compareVersions(v, max) <= 0;
  }

  /**
   * Generates suggestions for fixing compatibility issues
   */
  private generateSuggestions(
    issues: CompatibilityIssue[]
  ): CompatibilitySuggestion[] {
    const suggestions: CompatibilitySuggestion[] = [];
    const versionMap = new Map<string, Set<string>>();

    // Collect all required versions
    for (const issue of issues) {
      if (issue.type === 'incompatible-version') {
        const versions = versionMap.get(issue.dependency) || new Set();
        versions.add(`${issue.expected.min}-${issue.expected.max}`);
        versionMap.set(issue.dependency, versions);
      }
    }

    // Find compatible versions
    for (const [pkg, ranges] of versionMap.entries()) {
      const compatibleVersion = this.findCompatibleVersion(pkg, Array.from(ranges));
      if (compatibleVersion) {
        suggestions.push({
          package: pkg,
          suggestedVersion: compatibleVersion,
          reason: `Satisfies all dependencies`
        });
      }
    }

    return suggestions;
  }

  /**
   * Finds a version that satisfies all ranges
   */
  private findCompatibleVersion(
    packageName: string, 
    ranges: string[]
  ): string | null {
    const pkgManifest = this.manifest.packages[packageName];
    if (!pkgManifest) return null;

    // Check each supported version in reverse order (prefer newer)
    const versions = [...pkgManifest.supportedVersions].reverse();
    
    for (const version of versions) {
      let satisfiesAll = true;
      
      for (const range of ranges) {
        const [min, max] = range.split('-');
        if (!this.isVersionInRange(version, { min, max, tested: [] })) {
          satisfiesAll = false;
          break;
        }
      }
      
      if (satisfiesAll) return version;
    }

    return null;
  }

  /**
   * Simple version parser (replace with semver in production)
   */
  private parseVersion(version: string): number[] {
    return version.split('.').map(n => parseInt(n, 10));
  }

  /**
   * Compare two versions
   */
  private compareVersions(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aPart = a[i] || 0;
      const bPart = b[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  /**
   * Generates a compatibility report
   */
  generateReport(packages: Record<string, string>): CompatibilityReport {
    const validation = this.validateCompatibility(packages);
    const matrix = this.buildCompatibilityMatrix(packages);

    return {
      timestamp: new Date(),
      packages,
      validation,
      matrix,
      breaking: this.findBreakingChanges(packages),
      recommendations: this.generateRecommendations(validation, matrix)
    };
  }

  /**
   * Builds a visual compatibility matrix
   */
  private buildCompatibilityMatrix(
    packages: Record<string, string>
  ): CompatibilityMatrixView {
    const matrix: CompatibilityMatrixView = {
      packages: Object.keys(packages),
      compatibility: {}
    };

    for (const pkg1 of matrix.packages) {
      matrix.compatibility[pkg1] = {};
      
      for (const pkg2 of matrix.packages) {
        if (pkg1 === pkg2) {
          matrix.compatibility[pkg1][pkg2] = 'self';
        } else {
          const compat = this.checkPairCompatibility(
            pkg1, packages[pkg1],
            pkg2, packages[pkg2]
          );
          matrix.compatibility[pkg1][pkg2] = compat;
        }
      }
    }

    return matrix;
  }

  /**
   * Checks compatibility between two packages
   */
  private checkPairCompatibility(
    pkg1: string, version1: string,
    pkg2: string, version2: string
  ): 'compatible' | 'incompatible' | 'unknown' {
    const manifest1 = this.manifest.packages[pkg1];
    const manifest2 = this.manifest.packages[pkg2];

    if (!manifest1 || !manifest2) return 'unknown';

    // Check if pkg1 depends on pkg2
    const dep1to2 = manifest1.dependencies[pkg2];
    if (dep1to2 && !this.isVersionInRange(version2, dep1to2)) {
      return 'incompatible';
    }

    // Check if pkg2 depends on pkg1
    const dep2to1 = manifest2.dependencies[pkg1];
    if (dep2to1 && !this.isVersionInRange(version1, dep2to1)) {
      return 'incompatible';
    }

    return 'compatible';
  }

  /**
   * Finds breaking changes between versions
   */
  private findBreakingChanges(
    packages: Record<string, string>
  ): BreakingChange[] {
    const breaking: BreakingChange[] = [];

    for (const change of this.manifest.breaking) {
      const currentVersion = packages[change.package];
      if (!currentVersion) continue;

      // Check if current version is affected
      const current = this.parseVersion(currentVersion);
      const from = this.parseVersion(change.fromVersion);
      const to = this.parseVersion(change.toVersion);

      if (this.compareVersions(current, from) >= 0 &&
          this.compareVersions(current, to) < 0) {
        breaking.push(change);
      }
    }

    return breaking;
  }

  /**
   * Generates recommendations based on validation
   */
  private generateRecommendations(
    validation: ValidationResult,
    matrix: CompatibilityMatrixView
  ): string[] {
    const recommendations: string[] = [];

    if (!validation.valid) {
      recommendations.push(
        'Consider using the suggested versions to resolve compatibility issues'
      );
    }

    // Check for too many incompatible pairs
    let incompatibleCount = 0;
    for (const pkg1 in matrix.compatibility) {
      for (const pkg2 in matrix.compatibility[pkg1]) {
        if (matrix.compatibility[pkg1][pkg2] === 'incompatible') {
          incompatibleCount++;
        }
      }
    }

    if (incompatibleCount > 5) {
      recommendations.push(
        'Many incompatibilities detected. Consider upgrading all packages together.'
      );
    }

    return recommendations;
  }
}

// Types
export interface ValidationResult {
  valid: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  suggestions: CompatibilitySuggestion[];
}

export interface CompatibilityIssue {
  type: 'missing-dependency' | 'incompatible-version' | 'breaking-change';
  package: string;
  dependency?: string;
  expected?: VersionRange;
  actual?: string;
  message: string;
}

export interface CompatibilityWarning {
  type: 'unknown-package' | 'prerelease' | 'deprecated';
  package: string;
  message: string;
}

export interface CompatibilitySuggestion {
  package: string;
  suggestedVersion: string;
  reason: string;
}

export interface CompatibilityReport {
  timestamp: Date;
  packages: Record<string, string>;
  validation: ValidationResult;
  matrix: CompatibilityMatrixView;
  breaking: BreakingChange[];
  recommendations: string[];
}

export interface CompatibilityMatrixView {
  packages: string[];
  compatibility: Record<string, Record<string, 
    'compatible' | 'incompatible' | 'unknown' | 'self'>>;
}