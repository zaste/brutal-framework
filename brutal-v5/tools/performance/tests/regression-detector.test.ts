import { describe, it, expect, beforeEach } from '@jest/globals';
import { RegressionDetector } from '../regression-detector.js';
import { BenchmarkSuite } from '../benchmark-suite.js';

describe('RegressionDetector', () => {
  let detector: RegressionDetector;

  beforeEach(() => {
    detector = new RegressionDetector({
      error: 10,
      warning: 5,
      improvement: 5
    });
  });

  function createBenchmarkSuite(
    name: string,
    packageName: string,
    benchmarks: Array<{ name: string; ops: number; mean: number }>
  ): BenchmarkSuite {
    return {
      name,
      package: packageName,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: {
        node: 'v18.0.0',
        platform: 'darwin x64',
        cpu: 'Intel i7',
        memory: '16GB'
      },
      benchmarks: benchmarks.map(b => ({
        name: b.name,
        ops: b.ops,
        mean: b.mean,
        median: b.mean,
        min: b.mean * 0.9,
        max: b.mean * 1.1,
        stdDev: b.mean * 0.05,
        samples: 30,
        confidence: b.mean * 0.02,
        relative: 1.0
      }))
    };
  }

  it('should detect performance regressions', () => {
    const current = new Map([
      ['Suite1', createBenchmarkSuite('Suite1', '@brutal/test', [
        { name: 'fast-op', ops: 900, mean: 1.11 }, // 10% regression
        { name: 'slow-op', ops: 950, mean: 1.05 }  // 5% regression
      ])]
    ]);

    const baseline = new Map([
      ['Suite1', createBenchmarkSuite('Suite1', '@brutal/test', [
        { name: 'fast-op', ops: 1000, mean: 1.0 },
        { name: 'slow-op', ops: 1000, mean: 1.0 }
      ])]
    ]);

    const report = detector.detectRegressions(current, baseline);

    expect(report.summary.total).toBe(2);
    expect(report.summary.errors).toBe(1); // 10% regression
    expect(report.summary.warnings).toBe(1); // 5% regression
    expect(report.regressions[0].severity).toBe('error');
    expect(report.regressions[0].change).toBeCloseTo(-10, 0);
  });

  it('should detect performance improvements', () => {
    const current = new Map([
      ['Suite1', createBenchmarkSuite('Suite1', '@brutal/test', [
        { name: 'optimized-op', ops: 1100, mean: 0.909 } // 10% improvement
      ])]
    ]);

    const baseline = new Map([
      ['Suite1', createBenchmarkSuite('Suite1', '@brutal/test', [
        { name: 'optimized-op', ops: 1000, mean: 1.0 }
      ])]
    ]);

    const report = detector.detectRegressions(current, baseline);

    expect(report.summary.improvements).toBe(1);
    expect(report.regressions[0].severity).toBe('improved');
    expect(report.regressions[0].change).toBeCloseTo(10, 0);
  });

  it('should determine statistical significance', () => {
    // Create benchmarks with overlapping confidence intervals
    const current = new Map([
      ['Suite1', {
        name: 'Suite1',
        package: '@brutal/test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          node: 'v18.0.0',
          platform: 'darwin x64',
          cpu: 'Intel i7',
          memory: '16GB'
        },
        benchmarks: [{
          name: 'marginal-change',
          ops: 980,
          mean: 1.02,
          median: 1.02,
          min: 0.98,
          max: 1.06,
          stdDev: 0.02,
          samples: 30,
          confidence: 0.1, // Large confidence interval
          relative: 1.0
        }]
      }]
    ]);

    const baseline = new Map([
      ['Suite1', {
        name: 'Suite1',
        package: '@brutal/test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          node: 'v18.0.0',
          platform: 'darwin x64',
          cpu: 'Intel i7',
          memory: '16GB'
        },
        benchmarks: [{
          name: 'marginal-change',
          ops: 1000,
          mean: 1.0,
          median: 1.0,
          min: 0.95,
          max: 1.05,
          stdDev: 0.025,
          samples: 30,
          confidence: 0.1, // Large confidence interval
          relative: 1.0
        }]
      }]
    ]);

    const report = detector.detectRegressions(current, baseline);

    // Should not report as significant due to overlapping confidence intervals
    expect(report.regressions.find(r => r.benchmark === 'marginal-change')).toBeUndefined();
  });

  it('should generate recommendations', () => {
    const current = new Map([
      ['Components', createBenchmarkSuite('Components', '@brutal/components', [
        { name: 'render', ops: 800, mean: 1.25 }, // 20% regression
        { name: 'update', ops: 850, mean: 1.18 }  // 15% regression
      ])],
      ['Events', createBenchmarkSuite('Events', '@brutal/events', [
        { name: 'dispatch', ops: 1200, mean: 0.83 } // 20% improvement
      ])]
    ]);

    const baseline = new Map([
      ['Components', createBenchmarkSuite('Components', '@brutal/components', [
        { name: 'render', ops: 1000, mean: 1.0 },
        { name: 'update', ops: 1000, mean: 1.0 }
      ])],
      ['Events', createBenchmarkSuite('Events', '@brutal/events', [
        { name: 'dispatch', ops: 1000, mean: 1.0 }
      ])]
    ]);

    const report = detector.detectRegressions(current, baseline);

    expect(report.recommendations).toContain(
      '🚨 2 critical performance regression(s) detected. Immediate action required!'
    );
    expect(report.recommendations).toContain(
      '   - Review recent changes to @brutal/components (2 regressions)'
    );
    expect(report.recommendations).toContain(
      '🎉 1 performance improvement(s) detected! Good work!'
    );
  });

  it('should generate markdown report', () => {
    const report = {
      timestamp: '2024-01-01T00:00:00Z',
      summary: {
        total: 3,
        errors: 1,
        warnings: 1,
        improvements: 1,
        ok: 0
      },
      regressions: [
        {
          benchmark: 'slow-op',
          package: '@brutal/test',
          current: {
            name: 'slow-op',
            ops: 900,
            mean: 1.11,
            median: 1.11,
            min: 1.0,
            max: 1.2,
            stdDev: 0.05,
            samples: 30,
            confidence: 0.02,
            relative: 0.9
          },
          baseline: {
            name: 'slow-op',
            ops: 1000,
            mean: 1.0,
            median: 1.0,
            min: 0.9,
            max: 1.1,
            stdDev: 0.05,
            samples: 30,
            confidence: 0.02,
            relative: 1.0
          },
          change: -10,
          severity: 'error' as const,
          significant: true,
          message: '🚨 CRITICAL: slow-op is 10.0% slower (statistically significant)'
        }
      ],
      recommendations: ['🚨 1 critical performance regression(s) detected. Immediate action required!']
    };

    const markdown = detector.generateMarkdownReport(report);

    expect(markdown).toContain('# Performance Regression Report');
    expect(markdown).toContain('Critical regressions: 1');
    expect(markdown).toContain('🚨 Critical Regressions');
    expect(markdown).toContain('slow-op');
    expect(markdown).toContain('-10.0%');
  });

  it('should determine build failure correctly', () => {
    const reportWithErrors = {
      timestamp: new Date().toISOString(),
      summary: { total: 1, errors: 1, warnings: 0, improvements: 0, ok: 0 },
      regressions: [],
      recommendations: []
    };

    const reportWithWarnings = {
      timestamp: new Date().toISOString(),
      summary: { total: 1, errors: 0, warnings: 1, improvements: 0, ok: 0 },
      regressions: [],
      recommendations: []
    };

    const reportClean = {
      timestamp: new Date().toISOString(),
      summary: { total: 1, errors: 0, warnings: 0, improvements: 1, ok: 0 },
      regressions: [],
      recommendations: []
    };

    expect(detector.shouldFailBuild(reportWithErrors)).toBe(true);
    expect(detector.shouldFailBuild(reportWithWarnings)).toBe(false);
    expect(detector.shouldFailBuild(reportClean)).toBe(false);

    expect(detector.getExitCode(reportWithErrors)).toBe(1);
    expect(detector.getExitCode(reportWithWarnings)).toBe(2);
    expect(detector.getExitCode(reportClean)).toBe(0);
  });
});