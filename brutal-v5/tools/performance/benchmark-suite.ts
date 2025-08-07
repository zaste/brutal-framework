/**
 * Performance Benchmark Suite for BRUTAL V5
 * 
 * Provides comprehensive performance testing across all packages
 * with statistical analysis and regression detection
 */

import * as os from 'os';

export interface BenchmarkResult {
  name: string;
  ops: number; // Operations per second
  mean: number; // Mean time in milliseconds
  median: number;
  min: number;
  max: number;
  stdDev: number;
  samples: number;
  confidence: number; // 95% confidence interval
  relative: number; // Relative to baseline (1.0 = baseline)
}

export interface BenchmarkSuite {
  name: string;
  package: string;
  version: string;
  timestamp: string;
  environment: {
    node: string;
    platform: string;
    cpu: string;
    memory: string;
  };
  benchmarks: BenchmarkResult[];
}

export interface BenchmarkOptions {
  iterations?: number;
  warmup?: number;
  minSamples?: number;
  maxTime?: number; // Max time per benchmark in seconds
  baseline?: BenchmarkSuite; // For comparison
}

export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private startTime: number = 0;
  private samples: number[] = [];

  constructor(
    private name: string,
    private fn: () => void | Promise<void>,
    private options: BenchmarkOptions = {}
  ) {
    this.options = {
      iterations: 100,
      warmup: 10,
      minSamples: 30,
      maxTime: 5,
      ...options
    };
  }

  async run(): Promise<BenchmarkResult> {
    console.log(`🏃 Running benchmark: ${this.name}`);
    
    // Warmup phase
    for (let i = 0; i < this.options.warmup!; i++) {
      await this.fn();
    }

    // Actual benchmarking
    this.samples = [];
    const maxTime = this.options.maxTime! * 1000; // Convert to ms
    const startTime = Date.now();

    while (
      this.samples.length < this.options.minSamples! ||
      (Date.now() - startTime < maxTime && this.samples.length < 1000)
    ) {
      const iterStart = performance.now();
      
      for (let i = 0; i < this.options.iterations!; i++) {
        await this.fn();
      }
      
      const iterEnd = performance.now();
      const timePerOp = (iterEnd - iterStart) / this.options.iterations!;
      this.samples.push(timePerOp);
    }

    return this.analyze();
  }

  private analyze(): BenchmarkResult {
    const sorted = [...this.samples].sort((a, b) => a - b);
    const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Calculate standard deviation
    const variance = this.samples.reduce((acc, val) => {
      return acc + Math.pow(val - mean, 2);
    }, 0) / this.samples.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate ops/sec
    const ops = 1000 / mean; // Convert from ms to seconds
    
    // Calculate 95% confidence interval
    const confidence = 1.96 * (stdDev / Math.sqrt(this.samples.length));
    
    // Calculate relative performance
    let relative = 1.0;
    if (this.options.baseline) {
      const baselineBench = this.options.baseline.benchmarks.find(b => b.name === this.name);
      if (baselineBench) {
        relative = baselineBench.ops / ops; // Higher is better
      }
    }

    return {
      name: this.name,
      ops: Math.round(ops),
      mean: parseFloat(mean.toFixed(3)),
      median: parseFloat(median.toFixed(3)),
      min: parseFloat(min.toFixed(3)),
      max: parseFloat(max.toFixed(3)),
      stdDev: parseFloat(stdDev.toFixed(3)),
      samples: this.samples.length,
      confidence: parseFloat(confidence.toFixed(3)),
      relative
    };
  }
}

export class BenchmarkRunner {
  private suites: Map<string, PerformanceBenchmark[]> = new Map();
  
  constructor(private options: BenchmarkOptions = {}) {}

  addSuite(suiteName: string, benchmarks: Array<[string, () => void | Promise<void>]>) {
    const suite = benchmarks.map(([name, fn]) => 
      new PerformanceBenchmark(name, fn, this.options)
    );
    this.suites.set(suiteName, suite);
  }

  async runAll(): Promise<Map<string, BenchmarkSuite>> {
    const results = new Map<string, BenchmarkSuite>();
    
    for (const [suiteName, benchmarks] of this.suites) {
      console.log(`\n📊 Running suite: ${suiteName}\n`);
      
      const benchmarkResults: BenchmarkResult[] = [];
      
      for (const benchmark of benchmarks) {
        const result = await benchmark.run();
        benchmarkResults.push(result);
        this.printResult(result);
      }
      
      results.set(suiteName, {
        name: suiteName,
        package: this.extractPackageName(suiteName),
        version: await this.getPackageVersion(suiteName),
        timestamp: new Date().toISOString(),
        environment: this.getEnvironment(),
        benchmarks: benchmarkResults
      });
    }
    
    return results;
  }

  private printResult(result: BenchmarkResult) {
    const opsFormatted = result.ops.toLocaleString();
    const relativeStr = result.relative !== 1.0 
      ? ` (${result.relative > 1 ? '+' : ''}${((result.relative - 1) * 100).toFixed(1)}%)`
      : '';
    
    console.log(`  ✓ ${result.name}:`);
    console.log(`    ${opsFormatted} ops/sec ±${((result.confidence / result.mean) * 100).toFixed(2)}%${relativeStr}`);
    console.log(`    Mean: ${result.mean}ms | Samples: ${result.samples}`);
  }

  private extractPackageName(suiteName: string): string {
    const match = suiteName.match(/@brutal\/[\w-]+/);
    return match ? match[0] : 'unknown';
  }

  private async getPackageVersion(suiteName: string): Promise<string> {
    try {
      const packageName = this.extractPackageName(suiteName);
      const packagePath = `/workspaces/web/brutal-v5/packages/${packageName.replace('@brutal/', '')}/package.json`;
      const { readFile } = await import('fs/promises');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  private getEnvironment() {
    return {
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      cpu: os.cpus()[0].model,
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`
    };
  }

  async saveResults(results: Map<string, BenchmarkSuite>, outputPath: string) {
    const { writeFile } = await import('fs/promises');
    const data = {
      timestamp: new Date().toISOString(),
      suites: Array.from(results.values())
    };
    await writeFile(outputPath, JSON.stringify(data, null, 2));
  }
}

// Helper to create micro-benchmarks
export function bench(name: string, fn: () => void | Promise<void>): [string, () => void | Promise<void>] {
  return [name, fn];
}

// Statistical helpers
export class BenchmarkStats {
  static compareResults(current: BenchmarkResult, baseline: BenchmarkResult): {
    change: number;
    significant: boolean;
    improved: boolean;
  } {
    const change = ((current.ops - baseline.ops) / baseline.ops) * 100;
    
    // Use t-test for significance (simplified)
    const pooledStdDev = Math.sqrt(
      (Math.pow(current.stdDev, 2) + Math.pow(baseline.stdDev, 2)) / 2
    );
    const tStatistic = Math.abs(current.mean - baseline.mean) / 
      (pooledStdDev * Math.sqrt(2 / current.samples));
    
    // For 95% confidence with ~60 samples, t-critical ≈ 2.0
    const significant = tStatistic > 2.0;
    const improved = current.ops > baseline.ops;
    
    return { change, significant, improved };
  }

  static generateReport(results: Map<string, BenchmarkSuite>, baseline?: Map<string, BenchmarkSuite>): string {
    let report = '# Performance Benchmark Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    for (const [name, suite] of results) {
      report += `## ${name}\n\n`;
      report += `Package: ${suite.package} v${suite.version}\n\n`;
      
      report += '| Benchmark | Ops/sec | Mean (ms) | StdDev | Samples | Change |\n';
      report += '|-----------|---------|-----------|--------|---------|--------|\n';
      
      for (const bench of suite.benchmarks) {
        const baselineSuite = baseline?.get(name);
        const baselineBench = baselineSuite?.benchmarks.find(b => b.name === bench.name);
        
        let changeStr = 'N/A';
        if (baselineBench) {
          const { change, significant } = this.compareResults(bench, baselineBench);
          const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
          const sigMarker = significant ? '**' : '';
          changeStr = `${sigMarker}${emoji} ${change > 0 ? '+' : ''}${change.toFixed(1)}%${sigMarker}`;
        }
        
        report += `| ${bench.name} | ${bench.ops.toLocaleString()} | ${bench.mean} | ${bench.stdDev} | ${bench.samples} | ${changeStr} |\n`;
      }
      
      report += '\n';
    }
    
    return report;
  }
}