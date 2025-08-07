import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BundleSizeTracker } from '../bundle-tracker.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('BundleSizeTracker', () => {
  let tracker: BundleSizeTracker;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `bundle-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    tracker = new BundleSizeTracker(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createMockBundle(
    packageName: string,
    bundleName: string,
    content: string
  ) {
    const packagePath = join(testDir, 'packages', packageName.replace('@brutal/', ''));
    const distPath = join(packagePath, 'dist');
    
    await mkdir(distPath, { recursive: true });
    await writeFile(join(distPath, bundleName), content);
    await writeFile(
      join(packagePath, 'package.json'),
      JSON.stringify({ name: packageName, version: '1.0.0' })
    );
  }

  it('should analyze bundle sizes', async () => {
    const testContent = 'console.log("Hello, world!");'.repeat(100);
    await createMockBundle('@brutal/test', 'index.js', testContent);

    const metrics = await tracker.analyzeBundles('@brutal/test', '1.0.0');

    expect(metrics.package).toBe('@brutal/test');
    expect(metrics.version).toBe('1.0.0');
    expect(metrics.bundles['index.js']).toBeDefined();
    expect(metrics.bundles['index.js'].raw).toBe(testContent.length);
    expect(metrics.bundles['index.js'].gzipped).toBeGreaterThan(0);
    expect(metrics.bundles['index.js'].gzipped).toBeLessThan(metrics.bundles['index.js'].raw);
    expect(metrics.total.raw).toBe(testContent.length);
  });

  it('should count modules in bundle', async () => {
    const bundleContent = `
      const a = require('module-a');
      import b from 'module-b';
      export default function() {}
      export { something };
    `;
    
    await createMockBundle('@brutal/test', 'index.js', bundleContent);
    const metrics = await tracker.analyzeBundles('@brutal/test', '1.0.0');

    expect(metrics.bundles['index.js'].modules).toBe(4); // 2 imports + 2 exports
  });

  it('should compare bundle metrics', async () => {
    // Create current metrics
    const current = new Map([
      ['@brutal/test', {
        package: '@brutal/test',
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 2000,
            gzipped: 800,
            brotli: 700,
            modules: 10,
            assets: []
          }
        },
        total: { raw: 2000, gzipped: 800, brotli: 700 }
      }]
    ]);

    // Create baseline metrics (smaller)
    const baseline = new Map([
      ['@brutal/test', {
        package: '@brutal/test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 1500,
            gzipped: 600,
            brotli: 500,
            modules: 8,
            assets: []
          }
        },
        total: { raw: 1500, gzipped: 600, brotli: 500 }
      }]
    ]);

    const report = tracker.compareMetrics(current, baseline);

    expect(report.changes).toHaveLength(1);
    expect(report.changes[0].change.raw).toBe(500);
    expect(report.changes[0].change.gzipped).toBe(200);
    expect(report.changes[0].change.gzippedPercent).toBeCloseTo(33.33, 1);
    expect(report.changes[0].severity).toBe('error'); // >10% increase
    expect(report.summary.increased).toBe(1);
  });

  it('should detect size improvements', async () => {
    const current = new Map([
      ['@brutal/test', {
        package: '@brutal/test',
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 1000,
            gzipped: 400,
            brotli: 350,
            modules: 5,
            assets: []
          }
        },
        total: { raw: 1000, gzipped: 400, brotli: 350 }
      }]
    ]);

    const baseline = new Map([
      ['@brutal/test', {
        package: '@brutal/test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 1500,
            gzipped: 600,
            brotli: 500,
            modules: 8,
            assets: []
          }
        },
        total: { raw: 1500, gzipped: 600, brotli: 500 }
      }]
    ]);

    const report = tracker.compareMetrics(current, baseline);

    expect(report.changes[0].severity).toBe('improved');
    expect(report.changes[0].change.gzippedPercent).toBeCloseTo(-33.33, 1);
    expect(report.summary.decreased).toBe(1);
  });

  it('should generate recommendations', async () => {
    const current = new Map([
      ['@brutal/components', {
        package: '@brutal/components',
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 50000,
            gzipped: 15000, // 50% increase from 10KB
            brotli: 12000,
            modules: 100,
            assets: []
          }
        },
        total: { raw: 50000, gzipped: 15000, brotli: 12000 }
      }]
    ]);

    const baseline = new Map([
      ['@brutal/components', {
        package: '@brutal/components',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bundles: {
          'index.js': {
            raw: 30000,
            gzipped: 10000,
            brotli: 8000,
            modules: 50,
            assets: []
          }
        },
        total: { raw: 30000, gzipped: 10000, brotli: 8000 }
      }]
    ]);

    const report = tracker.compareMetrics(current, baseline);

    expect(report.recommendations).toContain(
      '🚨 1 bundle(s) increased by more than 10%!'
    );
    expect(report.recommendations.some(r => 
      r.includes('@brutal/components/index.js: +4.9KB gzipped (+50.0%)')
    )).toBe(true);
    expect(report.recommendations).toContain(
      '   → Run bundle analyzer to identify large dependencies'
    );
  });

  it('should generate markdown report', () => {
    const report = {
      timestamp: '2024-01-01T00:00:00Z',
      changes: [
        {
          bundle: 'index.js',
          package: '@brutal/test',
          current: { raw: 2000, gzipped: 800 },
          previous: { raw: 1500, gzipped: 600 },
          change: {
            raw: 500,
            rawPercent: 33.33,
            gzipped: 200,
            gzippedPercent: 33.33
          },
          severity: 'error' as const
        }
      ],
      summary: {
        totalPackages: 1,
        increased: 1,
        decreased: 0,
        unchanged: 0,
        largestIncrease: null,
        largestDecrease: null
      },
      recommendations: ['🚨 Bundle size increased significantly']
    };

    const markdown = tracker.generateMarkdownReport(report);

    expect(markdown).toContain('# Bundle Size Report');
    expect(markdown).toContain('## Size Changes');
    expect(markdown).toContain('@brutal/test');
    expect(markdown).toContain('index.js');
    expect(markdown).toContain('+200B (+33.3%)');
    expect(markdown).toContain('🚨'); // Error emoji
  });

  it('should generate PR comment', () => {
    const report = {
      timestamp: '2024-01-01T00:00:00Z',
      changes: [
        {
          bundle: 'index.js',
          package: '@brutal/components',
          current: { raw: 15000, gzipped: 5000 },
          previous: { raw: 10000, gzipped: 3000 },
          change: {
            raw: 5000,
            rawPercent: 50,
            gzipped: 2000,
            gzippedPercent: 66.67
          },
          severity: 'error' as const
        },
        {
          bundle: 'index.js',
          package: '@brutal/utils',
          current: { raw: 5000, gzipped: 1500 },
          previous: { raw: 6000, gzipped: 2000 },
          change: {
            raw: -1000,
            rawPercent: -16.67,
            gzipped: -500,
            gzippedPercent: -25
          },
          severity: 'improved' as const
        }
      ],
      summary: {
        totalPackages: 2,
        increased: 1,
        decreased: 1,
        unchanged: 0,
        largestIncrease: null,
        largestDecrease: null
      },
      recommendations: []
    };

    const comment = tracker.generatePRComment(report);

    expect(comment).toContain('## 📦 Bundle Size Changes');
    expect(comment).toContain('### ⚠️ Size increases detected:');
    expect(comment).toContain('🚨 **@brutal/components**');
    expect(comment).toContain('2.9KB → 4.9KB (+66.7%)');
    expect(comment).toContain('### 🎉 Size improvements:');
    expect(comment).toContain('✅ **@brutal/utils**');
    expect(comment).toContain('2.0KB → 1.5KB (-25.0%)');
  });
});