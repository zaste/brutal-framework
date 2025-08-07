/**
 * Compatibility Matrix Generator
 * 
 * Automatically generates a compatibility matrix by analyzing
 * all packages in the monorepo and their dependencies.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { VersionManifest, VersionRange, CompatibilityMatrix } from './version-manifest';

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  brutal?: {
    compatibility?: {
      tested?: string[];
      breaking?: string[];
    };
  };
}

export class CompatibilityMatrixGenerator {
  private rootDir: string;
  private packages: Map<string, PackageJson> = new Map();

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Generates a complete compatibility matrix for all packages
   */
  async generate(): Promise<VersionManifest> {
    console.log('🔍 Discovering packages...');
    await this.discoverPackages();

    console.log('📊 Building compatibility matrix...');
    const matrix = this.buildMatrix();

    console.log('🔍 Detecting breaking changes...');
    const breaking = await this.detectBreakingChanges();

    console.log('📝 Creating manifest...');
    const manifest: VersionManifest = {
      version: '1.0.0',
      generated: new Date(),
      packages: this.buildPackageManifest(),
      compatibility: matrix,
      breaking,
      validation: {
        strict: true,
        allowPrerelease: false,
        enforceAtRuntime: true
      }
    };

    console.log('✅ Compatibility matrix generated!');
    return manifest;
  }

  /**
   * Discovers all packages in the monorepo
   */
  private async discoverPackages(): Promise<void> {
    const packagesDir = join(this.rootDir, 'packages', '@brutal');
    const packageNames = await readdir(packagesDir);

    for (const pkgName of packageNames) {
      const pkgPath = join(packagesDir, pkgName, 'package.json');
      
      try {
        const content = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content) as PackageJson;
        this.packages.set(pkg.name, pkg);
        console.log(`  ✓ Found ${pkg.name}@${pkg.version}`);
      } catch (error) {
        console.warn(`  ⚠ Skipping ${pkgName}: ${error}`);
      }
    }

    console.log(`📦 Found ${this.packages.size} packages`);
  }

  /**
   * Builds the compatibility matrix
   */
  private buildMatrix(): CompatibilityMatrix {
    const matrix: CompatibilityMatrix = {};

    for (const [pkgName, pkg] of this.packages) {
      matrix[pkgName] = {
        [pkg.version]: {
          compatible: this.getCompatibleVersions(pkg),
          notes: this.generateNotes(pkg)
        }
      };
    }

    return matrix;
  }

  /**
   * Gets compatible versions for a package
   */
  private getCompatibleVersions(pkg: PackageJson): Record<string, VersionRange> {
    const compatible: Record<string, VersionRange> = {};
    const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (!depName.startsWith('@brutal/')) continue;

      const range = this.parseVersionRange(depVersion);
      const depPkg = this.packages.get(depName);

      if (depPkg) {
        // Use tested versions if available
        const tested = pkg.brutal?.compatibility?.tested || [depPkg.version];
        
        compatible[depName] = {
          ...range,
          tested
        };
      }
    }

    return compatible;
  }

  /**
   * Parses a version range string
   */
  private parseVersionRange(versionStr: string): VersionRange {
    // Handle workspace protocol
    if (versionStr.startsWith('workspace:')) {
      versionStr = versionStr.replace('workspace:', '');
      if (versionStr === '*' || versionStr === '^') {
        // For workspace:*, use current version
        return {
          min: '0.0.0',
          max: '999.999.999',
          tested: []
        };
      }
    }

    // Simple parsing - in production use semver
    if (versionStr.startsWith('^')) {
      const base = versionStr.substring(1);
      const [major] = base.split('.');
      return {
        min: base,
        max: `${parseInt(major) + 1}.0.0`,
        tested: []
      };
    }

    if (versionStr.startsWith('~')) {
      const base = versionStr.substring(1);
      const [major, minor] = base.split('.');
      return {
        min: base,
        max: `${major}.${parseInt(minor) + 1}.0`,
        tested: []
      };
    }

    // Exact version
    return {
      min: versionStr,
      max: versionStr,
      tested: [versionStr]
    };
  }

  /**
   * Builds the package manifest section
   */
  private buildPackageManifest(): VersionManifest['packages'] {
    const manifest: VersionManifest['packages'] = {};

    for (const [pkgName, pkg] of this.packages) {
      const deps: Record<string, VersionRange> = {};
      
      // Process dependencies
      const allDeps = { ...pkg.dependencies, ...pkg.peerDependencies };
      for (const [depName, depVersion] of Object.entries(allDeps)) {
        if (depName.startsWith('@brutal/')) {
          deps[depName] = this.parseVersionRange(depVersion);
        }
      }

      manifest[pkgName] = {
        currentVersion: pkg.version,
        supportedVersions: [pkg.version], // In production, include previous versions
        dependencies: deps
      };
    }

    return manifest;
  }

  /**
   * Detects breaking changes between versions
   */
  private async detectBreakingChanges(): Promise<VersionManifest['breaking']> {
    const breaking: VersionManifest['breaking'] = [];

    // In production, this would:
    // 1. Check git history for version bumps
    // 2. Analyze API surface changes
    // 3. Read CHANGELOG files
    // 4. Check migration guides

    // For now, check if packages declare breaking changes
    for (const [pkgName, pkg] of this.packages) {
      if (pkg.brutal?.compatibility?.breaking) {
        for (const version of pkg.brutal.compatibility.breaking) {
          breaking.push({
            package: pkgName,
            fromVersion: version,
            toVersion: pkg.version,
            changes: [`Breaking changes from ${version} to ${pkg.version}`],
            migrationGuide: `/docs/migration/${pkgName}-${version}-to-${pkg.version}.md`
          });
        }
      }
    }

    return breaking;
  }

  /**
   * Generates notes for a package version
   */
  private generateNotes(pkg: PackageJson): string {
    const notes: string[] = [];

    // Check for alpha/beta versions
    if (pkg.version.includes('alpha') || pkg.version.includes('beta')) {
      notes.push('Pre-release version - use with caution');
    }

    // Check for no dependencies
    const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
    const brutalDeps = Object.keys(deps).filter(d => d.startsWith('@brutal/'));
    
    if (brutalDeps.length === 0) {
      notes.push('No @brutal dependencies - base package');
    } else if (brutalDeps.length === 1) {
      notes.push('Single dependency - follows one-dependency rule');
    } else if (brutalDeps.length > 1) {
      notes.push(`Warning: ${brutalDeps.length} @brutal dependencies`);
    }

    return notes.join('; ');
  }

  /**
   * Saves the manifest to a file
   */
  async save(manifest: VersionManifest, outputPath: string): Promise<void> {
    const content = JSON.stringify(manifest, null, 2);
    await writeFile(outputPath, content, 'utf-8');
    console.log(`💾 Saved compatibility matrix to ${outputPath}`);
  }

  /**
   * Generates a visual HTML report
   */
  async generateHTMLReport(manifest: VersionManifest, outputPath: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>BRUTAL V5 Compatibility Matrix</title>
  <style>
    body { font-family: system-ui; margin: 20px; }
    h1 { color: #333; }
    .matrix { overflow-x: auto; }
    table { border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    th { background: #f5f5f5; position: sticky; top: 0; }
    .compatible { background: #d4edda; color: #155724; }
    .incompatible { background: #f8d7da; color: #721c24; }
    .unknown { background: #fff3cd; color: #856404; }
    .self { background: #e9ecef; color: #495057; }
    .package-name { text-align: left; font-weight: bold; }
    .stats { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .breaking { margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px; }
    .legend { margin: 20px 0; }
    .legend span { margin-right: 15px; padding: 2px 8px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>BRUTAL V5 Compatibility Matrix</h1>
  <p>Generated: ${manifest.generated}</p>
  
  <div class="stats">
    <h3>Summary</h3>
    <p>Total Packages: ${Object.keys(manifest.packages).length}</p>
    <p>Breaking Changes: ${manifest.breaking.length}</p>
    <p>Validation Mode: ${manifest.validation.strict ? 'Strict' : 'Lenient'}</p>
  </div>

  <div class="legend">
    <h3>Legend</h3>
    <span class="compatible">Compatible</span>
    <span class="incompatible">Incompatible</span>
    <span class="unknown">Unknown</span>
    <span class="self">Same Package</span>
  </div>

  <div class="matrix">
    <h3>Package Compatibility</h3>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          ${Object.keys(manifest.packages).map(pkg => 
            `<th>${pkg.replace('@brutal/', '')}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${this.generateMatrixRows(manifest)}
      </tbody>
    </table>
  </div>

  ${manifest.breaking.length > 0 ? `
  <div class="breaking">
    <h3>Breaking Changes</h3>
    <ul>
      ${manifest.breaking.map(b => 
        `<li><strong>${b.package}</strong>: ${b.fromVersion} → ${b.toVersion}
          ${b.migrationGuide ? `<a href="${b.migrationGuide}">Migration Guide</a>` : ''}
        </li>`
      ).join('')}
    </ul>
  </div>
  ` : ''}
</body>
</html>`;

    await writeFile(outputPath, html, 'utf-8');
    console.log(`📄 Generated HTML report at ${outputPath}`);
  }

  /**
   * Generates matrix rows for HTML report
   */
  private generateMatrixRows(manifest: VersionManifest): string {
    const packages = Object.keys(manifest.packages);
    const rows: string[] = [];

    for (const pkg1 of packages) {
      const cells: string[] = [`<td class="package-name">${pkg1.replace('@brutal/', '')}</td>`];
      
      for (const pkg2 of packages) {
        if (pkg1 === pkg2) {
          cells.push('<td class="self">-</td>');
        } else {
          const compat = this.checkCompatibility(manifest, pkg1, pkg2);
          cells.push(`<td class="${compat}">${compat}</td>`);
        }
      }
      
      rows.push(`<tr>${cells.join('')}</tr>`);
    }

    return rows.join('\n        ');
  }

  /**
   * Checks compatibility between two packages
   */
  private checkCompatibility(
    manifest: VersionManifest,
    pkg1: string,
    pkg2: string
  ): 'compatible' | 'incompatible' | 'unknown' {
    const pkg1Manifest = manifest.packages[pkg1];
    const pkg2Manifest = manifest.packages[pkg2];

    if (!pkg1Manifest || !pkg2Manifest) return 'unknown';

    // Check if pkg1 depends on pkg2
    const dep = pkg1Manifest.dependencies[pkg2];
    if (!dep) return 'unknown';

    // Check if current version is in range
    const currentVersion = pkg2Manifest.currentVersion;
    const [major1, minor1, patch1] = currentVersion.split('.').map(Number);
    const [majorMin, minorMin, patchMin] = dep.min.split('.').map(Number);
    const [majorMax, minorMax, patchMax] = dep.max.split('.').map(Number);

    const inRange = 
      (major1 > majorMin || (major1 === majorMin && minor1 > minorMin) || 
       (major1 === majorMin && minor1 === minorMin && patch1 >= patchMin)) &&
      (major1 < majorMax || (major1 === majorMax && minor1 < minorMax) || 
       (major1 === majorMax && minor1 === minorMax && patch1 <= patchMax));

    return inRange ? 'compatible' : 'incompatible';
  }
}

// CLI interface
if (require.main === module) {
  const generator = new CompatibilityMatrixGenerator(resolve(__dirname, '../..'));
  
  generator.generate()
    .then(manifest => {
      const outputPath = join(__dirname, 'compatibility-matrix.json');
      const htmlPath = join(__dirname, 'compatibility-matrix.html');
      
      return Promise.all([
        generator.save(manifest, outputPath),
        generator.generateHTMLReport(manifest, htmlPath)
      ]);
    })
    .catch(console.error);
}