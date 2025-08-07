import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  PerformanceBenchmark, 
  BenchmarkRunner, 
  BenchmarkStats,
  bench 
} from '../benchmark-suite.js';

describe('PerformanceBenchmark', () => {
  it('should run a simple benchmark', async () => {
    let counter = 0;
    const benchmark = new PerformanceBenchmark(
      'increment counter',
      () => { counter++; },
      { iterations: 10, warmup: 2, minSamples: 5 }
    );

    const result = await benchmark.run();

    expect(result.name).toBe('increment counter');
    expect(result.ops).toBeGreaterThan(0);
    expect(result.mean).toBeGreaterThanOrEqual(0); // Can be 0 for very fast ops
    expect(result.samples).toBeGreaterThanOrEqual(5);
    expect(counter).toBeGreaterThan(50); // warmup + samples * iterations
  });

  it('should calculate statistics correctly', async () => {
    const delays = [1, 2, 3, 4, 5];
    let index = 0;
    
    const benchmark = new PerformanceBenchmark(
      'varied delays',
      async () => {
        await new Promise(resolve => 
          setTimeout(resolve, delays[index % delays.length])
        );
        index++;
      },
      { iterations: 1, warmup: 0, minSamples: 5 }
    );

    const result = await benchmark.run();

    expect(result.median).toBeGreaterThan(0);
    expect(result.stdDev).toBeGreaterThan(0);
    expect(result.min).toBeLessThanOrEqual(result.max);
  });

  it('should calculate relative performance against baseline', async () => {
    const fn = () => { /* noop */ };
    
    const baseline = new PerformanceBenchmark('test', fn, {
      iterations: 10,
      warmup: 2,
      minSamples: 5
    });
    
    const baselineResult = await baseline.run();
    
    const current = new PerformanceBenchmark('test', fn, {
      iterations: 10,
      warmup: 2,
      minSamples: 5,
      baseline: {
        name: 'baseline',
        package: 'test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          node: process.version,
          platform: process.platform,
          cpu: 'test',
          memory: '16GB'
        },
        benchmarks: [baselineResult]
      }
    });

    const result = await current.run();
    
    expect(result.relative).toBeGreaterThan(0.5); // Should be reasonably close
    expect(result.relative).toBeLessThan(2.0); // Not too different
  });
});

describe('BenchmarkRunner', () => {
  let runner: BenchmarkRunner;

  beforeEach(() => {
    runner = new BenchmarkRunner({
      iterations: 5,
      warmup: 1,
      minSamples: 3
    });
  });

  it('should run multiple benchmark suites', async () => {
    runner.addSuite('Math Operations', [
      bench('addition', () => { 1 + 1; }),
      bench('multiplication', () => { 2 * 2; })
    ]);

    runner.addSuite('String Operations', [
      bench('concatenation', () => { 'a' + 'b'; }),
      bench('substring', () => { 'hello'.substring(1); })
    ]);

    const results = await runner.runAll();

    expect(results.size).toBe(2);
    expect(results.has('Math Operations')).toBe(true);
    expect(results.has('String Operations')).toBe(true);

    const mathSuite = results.get('Math Operations')!;
    expect(mathSuite.benchmarks).toHaveLength(2);
    expect(mathSuite.benchmarks[0].name).toBe('addition');
    expect(mathSuite.benchmarks[1].name).toBe('multiplication');
  });

  it('should extract package names correctly', async () => {
    runner.addSuite('@brutal/components - Rendering', [
      bench('render', () => { /* noop */ })
    ]);

    const results = await runner.runAll();
    const suite = results.get('@brutal/components - Rendering')!;
    
    expect(suite.package).toBe('@brutal/components');
  });
});

describe('BenchmarkStats', () => {
  it('should compare results correctly', () => {
    const current = {
      name: 'test',
      ops: 1100,
      mean: 0.909,
      median: 0.9,
      min: 0.8,
      max: 1.0,
      stdDev: 0.05,
      samples: 30,
      confidence: 0.02,
      relative: 1.0
    };

    const baseline = {
      name: 'test',
      ops: 1000,
      mean: 1.0,
      median: 1.0,
      min: 0.9,
      max: 1.1,
      stdDev: 0.05,
      samples: 30,
      confidence: 0.02,
      relative: 1.0
    };

    const comparison = BenchmarkStats.compareResults(current, baseline);

    expect(comparison.change).toBeCloseTo(10, 1); // 10% improvement
    expect(comparison.improved).toBe(true);
    // Significance depends on actual variance
  });

  it('should generate markdown report', () => {
    const results = new Map([
      ['Test Suite', {
        name: 'Test Suite',
        package: '@brutal/test',
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00Z',
        environment: {
          node: 'v18.0.0',
          platform: 'darwin x64',
          cpu: 'Intel i7',
          memory: '16GB'
        },
        benchmarks: [{
          name: 'test',
          ops: 1000,
          mean: 1.0,
          median: 1.0,
          min: 0.9,
          max: 1.1,
          stdDev: 0.05,
          samples: 30,
          confidence: 0.02,
          relative: 1.0
        }]
      }]
    ]);

    const report = BenchmarkStats.generateReport(results);

    expect(report).toContain('# Performance Benchmark Report');
    expect(report).toContain('Test Suite');
    expect(report).toContain('@brutal/test');
    expect(report).toContain('1,000'); // Formatted ops/sec
  });
});