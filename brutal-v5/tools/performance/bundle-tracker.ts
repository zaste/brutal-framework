/**
 * Bundle Size Tracking System
 * 
 * Monitors bundle sizes across packages and detects bloat
 */

import { gzipSync } from 'zlib';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export interface BundleMetrics {
  package: string;
  version: string;
  timestamp: string;
  bundles: {
    [name: string]: {
      raw: number;
      gzipped: number;
      brotli: number;
      modules: number; // Number of modules
      assets: string[]; // Additional assets
    };
  };
  total: {
    raw: number;
    gzipped: number;
    brotli: number;
  };
}

export interface BundleSizeChange {
  bundle: string;
  package: string;
  current: { raw: number; gzipped: number };
  previous: { raw: number; gzipped: number };
  change: {
    raw: number;
    rawPercent: number;
    gzipped: number;
    gzippedPercent: number;
  };
  severity: 'error' | 'warning' | 'ok' | 'improved';
}

export interface BundleReport {
  timestamp: string;
  changes: BundleSizeChange[];
  summary: {
    totalPackages: number;
    increased: number;
    decreased: number;
    unchanged: number;
    largestIncrease: BundleSizeChange | null;
    largestDecrease: BundleSizeChange | null;
  };
  recommendations: string[];
}

export class BundleSizeTracker {
  private history: Map<string, BundleMetrics[]> = new Map();
  private thresholds = {
    error: 10,      // 10% increase = error
    warning: 5,     // 5% increase = warning
    improvement: 5  // 5% decrease = improvement
  };

  constructor(private basePath: string) {}

  async analyzeBundles(packageName: string, version: string): Promise<BundleMetrics> {
    const packagePath = join(this.basePath, 'packages', packageName.replace('@brutal/', ''));
    const distPath = join(packagePath, 'dist');
    
    const bundles: BundleMetrics['bundles'] = {};
    let totalRaw = 0;
    let totalGzipped = 0;
    let totalBrotli = 0;

    try {
      // Analyze main bundles
      const bundleFiles = ['index.js', 'index.esm.js', 'index.min.js'];
      
      for (const file of bundleFiles) {
        const filePath = join(distPath, file);
        try {
          const content = await readFile(filePath);
          const stats = await stat(filePath);
          
          const gzipped = gzipSync(content);
          const brotli = await this.brotliCompress(content);
          
          bundles[file] = {
            raw: stats.size,
            gzipped: gzipped.length,
            brotli: brotli.length,
            modules: this.countModules(content.toString()),
            assets: await this.findAssets(distPath, file)
          };
          
          totalRaw += stats.size;
          totalGzipped += gzipped.length;
          totalBrotli += brotli.length;
        } catch (error) {
          // Bundle doesn't exist, skip
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not analyze bundles for ${packageName}:`, error);
    }

    const metrics: BundleMetrics = {
      package: packageName,
      version,
      timestamp: new Date().toISOString(),
      bundles,
      total: {
        raw: totalRaw,
        gzipped: totalGzipped,
        brotli: totalBrotli
      }
    };

    // Add to history
    const key = packageName;
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    this.history.get(key)!.push(metrics);

    return metrics;
  }

  async analyzeAllPackages(): Promise<Map<string, BundleMetrics>> {
    const results = new Map<string, BundleMetrics>();
    
    // Discover all packages
    const packages = await this.discoverPackages();
    
    for (const [name, version] of packages) {
      const metrics = await this.analyzeBundles(name, version);
      results.set(name, metrics);
    }
    
    return results;
  }

  compareMetrics(
    current: Map<string, BundleMetrics>,
    previous: Map<string, BundleMetrics>
  ): BundleReport {
    const changes: BundleSizeChange[] = [];
    
    for (const [packageName, currentMetrics] of current) {
      const previousMetrics = previous.get(packageName);
      if (!previousMetrics) continue;
      
      // Compare each bundle
      for (const [bundleName, currentBundle] of Object.entries(currentMetrics.bundles)) {
        const previousBundle = previousMetrics.bundles[bundleName];
        if (!previousBundle) continue;
        
        const change = this.calculateChange(
          bundleName,
          packageName,
          currentBundle,
          previousBundle
        );
        
        if (change) {
          changes.push(change);
        }
      }
    }
    
    return this.generateReport(changes);
  }

  private calculateChange(
    bundle: string,
    packageName: string,
    current: { raw: number; gzipped: number },
    previous: { raw: number; gzipped: number }
  ): BundleSizeChange | null {
    const rawChange = current.raw - previous.raw;
    const rawPercent = (rawChange / previous.raw) * 100;
    const gzippedChange = current.gzipped - previous.gzipped;
    const gzippedPercent = (gzippedChange / previous.gzipped) * 100;
    
    // Skip if no meaningful change
    if (Math.abs(rawPercent) < 0.1 && Math.abs(gzippedPercent) < 0.1) {
      return null;
    }
    
    let severity: BundleSizeChange['severity'] = 'ok';
    if (gzippedPercent >= this.thresholds.error) {
      severity = 'error';
    } else if (gzippedPercent >= this.thresholds.warning) {
      severity = 'warning';
    } else if (gzippedPercent <= -this.thresholds.improvement) {
      severity = 'improved';
    }
    
    return {
      bundle,
      package: packageName,
      current: { raw: current.raw, gzipped: current.gzipped },
      previous: { raw: previous.raw, gzipped: previous.gzipped },
      change: {
        raw: rawChange,
        rawPercent,
        gzipped: gzippedChange,
        gzippedPercent
      },
      severity
    };
  }

  private generateReport(changes: BundleSizeChange[]): BundleReport {
    const increased = changes.filter(c => c.change.gzipped > 0);
    const decreased = changes.filter(c => c.change.gzipped < 0);
    const unchanged = changes.filter(c => c.change.gzipped === 0);
    
    const largestIncrease = increased.reduce((max, current) => 
      !max || current.change.gzippedPercent > max.change.gzippedPercent ? current : max
    , null as BundleSizeChange | null);
    
    const largestDecrease = decreased.reduce((max, current) => 
      !max || Math.abs(current.change.gzippedPercent) > Math.abs(max.change.gzippedPercent) ? current : max
    , null as BundleSizeChange | null);

    const summary = {
      totalPackages: new Set(changes.map(c => c.package)).size,
      increased: increased.length,
      decreased: decreased.length,
      unchanged: unchanged.length,
      largestIncrease,
      largestDecrease
    };
    
    const recommendations = this.generateRecommendations(changes, summary);
    
    return {
      timestamp: new Date().toISOString(),
      changes: changes.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, ok: 2, improved: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      summary,
      recommendations
    };
  }

  private generateRecommendations(changes: BundleSizeChange[], summary: BundleReport['summary']): string[] {
    const recs: string[] = [];
    
    // Check for critical increases
    const errors = changes.filter(c => c.severity === 'error');
    if (errors.length > 0) {
      recs.push(`🚨 ${errors.length} bundle(s) increased by more than ${this.thresholds.error}%!`);
      
      for (const error of errors) {
        recs.push(
          `   - ${error.package}/${error.bundle}: +${this.formatSize(error.change.gzipped)} gzipped (+${error.change.gzippedPercent.toFixed(1)}%)`
        );
      }
      
      recs.push('   → Run bundle analyzer to identify large dependencies');
      recs.push('   → Consider code splitting or lazy loading');
    }
    
    // Check for largest increase
    if (summary.largestIncrease && summary.largestIncrease.change.gzipped > 1000) {
      recs.push(
        `📦 Largest increase: ${summary.largestIncrease.package} (+${this.formatSize(summary.largestIncrease.change.gzipped)})`
      );
    }
    
    // Celebrate improvements
    if (summary.decreased > 0) {
      recs.push(`🎉 ${summary.decreased} bundle(s) decreased in size!`);
      if (summary.largestDecrease) {
        recs.push(
          `   Best improvement: ${summary.largestDecrease.package} (-${this.formatSize(Math.abs(summary.largestDecrease.change.gzipped))})`
        );
      }
    }
    
    return recs;
  }

  private async discoverPackages(): Promise<Map<string, string>> {
    const packages = new Map<string, string>();
    
    try {
      const { readdir } = await import('fs/promises');
      const packagesDir = join(this.basePath, 'packages');
      const dirs = await readdir(packagesDir);
      
      for (const dir of dirs) {
        try {
          const packageJsonPath = join(packagesDir, dir, 'package.json');
          const content = await readFile(packageJsonPath, 'utf-8');
          const pkg = JSON.parse(content);
          packages.set(pkg.name, pkg.version);
        } catch {
          // Skip if no package.json
        }
      }
    } catch (error) {
      console.error('Failed to discover packages:', error);
    }
    
    return packages;
  }

  private countModules(content: string): number {
    // Simple heuristic: count CommonJS/ES module patterns
    const patterns = [
      /require\(['"`][^'"`]+['"`]\)/g,
      /import\s+.*\s+from\s+['"`][^'"`]+['"`]/g,
      /export\s+(default\s+)?/g
    ];
    
    let count = 0;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    }
    
    return count;
  }

  private async findAssets(distPath: string, bundleName: string): Promise<string[]> {
    const assets: string[] = [];
    const baseName = bundleName.replace(/\.js$/, '');
    
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(distPath);
      
      for (const file of files) {
        if (file.startsWith(baseName) && !file.endsWith('.js')) {
          assets.push(file);
        }
      }
    } catch {
      // No assets
    }
    
    return assets;
  }

  private async brotliCompress(content: Buffer): Promise<Buffer> {
    const { promisify } = await import('util');
    const { brotliCompress } = await import('zlib');
    const compress = promisify(brotliCompress);
    return compress(content);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  generateMarkdownReport(report: BundleReport): string {
    let md = '# Bundle Size Report\n\n';
    md += `Generated: ${report.timestamp}\n\n`;
    
    // Summary
    md += '## Summary\n\n';
    md += `- Packages analyzed: ${report.summary.totalPackages}\n`;
    md += `- 📈 Increased: ${report.summary.increased}\n`;
    md += `- 📉 Decreased: ${report.summary.decreased}\n`;
    md += `- ➡️  Unchanged: ${report.summary.unchanged}\n\n`;
    
    // Recommendations
    if (report.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      report.recommendations.forEach(rec => md += `${rec}\n`);
      md += '\n';
    }
    
    // Changes table
    if (report.changes.length > 0) {
      md += '## Size Changes\n\n';
      md += '| Package | Bundle | Previous | Current | Change | Status |\n';
      md += '|---------|--------|----------|---------|--------|--------|\n';
      
      for (const change of report.changes) {
        const emoji = {
          error: '🚨',
          warning: '⚠️',
          improved: '🎉',
          ok: '✓'
        }[change.severity];
        
        const changeStr = change.change.gzipped > 0 
          ? `+${this.formatSize(change.change.gzipped)} (+${change.change.gzippedPercent.toFixed(1)}%)`
          : `${this.formatSize(change.change.gzipped)} (${change.change.gzippedPercent.toFixed(1)}%)`;
        
        md += `| ${change.package} | ${change.bundle} | ${this.formatSize(change.previous.gzipped)} | ${this.formatSize(change.current.gzipped)} | ${changeStr} | ${emoji} |\n`;
      }
    }
    
    return md;
  }

  // GitHub Action comment helper
  generatePRComment(report: BundleReport): string {
    let comment = '## 📦 Bundle Size Changes\n\n';
    
    const errors = report.changes.filter(c => c.severity === 'error');
    const warnings = report.changes.filter(c => c.severity === 'warning');
    
    if (errors.length > 0 || warnings.length > 0) {
      comment += '### ⚠️ Size increases detected:\n\n';
      
      [...errors, ...warnings].forEach(change => {
        const emoji = change.severity === 'error' ? '🚨' : '⚠️';
        comment += `${emoji} **${change.package}** ${change.bundle}: ${this.formatSize(change.previous.gzipped)} → ${this.formatSize(change.current.gzipped)} (+${change.change.gzippedPercent.toFixed(1)}%)\n`;
      });
      
      comment += '\n';
    }
    
    const improvements = report.changes.filter(c => c.severity === 'improved');
    if (improvements.length > 0) {
      comment += '### 🎉 Size improvements:\n\n';
      
      improvements.forEach(change => {
        comment += `✅ **${change.package}** ${change.bundle}: ${this.formatSize(change.previous.gzipped)} → ${this.formatSize(change.current.gzipped)} (${change.change.gzippedPercent.toFixed(1)}%)\n`;
      });
    }
    
    return comment;
  }
}