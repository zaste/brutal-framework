/**
 * Memory Leak Detection System
 * 
 * Detects memory leaks in packages during test runs
 */

import * as os from 'os';

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number; // Resident Set Size
}

export interface LeakDetectionResult {
  package: string;
  test: string;
  leaked: boolean;
  confidence: number; // 0-1
  growthRate: number; // MB per iteration
  snapshots: MemorySnapshot[];
  analysis: {
    trend: 'increasing' | 'stable' | 'decreasing';
    correlation: number; // Correlation coefficient
    recommendation: string;
  };
}

export interface MemoryLeakReport {
  timestamp: string;
  results: LeakDetectionResult[];
  summary: {
    total: number;
    leaks: number;
    suspicious: number;
    clean: number;
  };
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    platform: string;
    nodeVersion: string;
  };
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private baselineMemory: number = 0;
  private gcCallbacks: Array<() => void> = [];

  constructor(
    private options: {
      iterations?: number;
      threshold?: number; // MB growth per iteration to consider leak
      warmup?: number;
      gcInterval?: number; // Force GC every N iterations
      confidence?: number; // Required confidence level (0-1)
    } = {}
  ) {
    this.options = {
      iterations: 100,
      threshold: 0.1, // 100KB per iteration
      warmup: 10,
      gcInterval: 10,
      confidence: 0.8,
      ...options
    };
  }

  async detectLeak(
    testName: string,
    testFn: () => void | Promise<void>,
    cleanupFn?: () => void | Promise<void>
  ): Promise<LeakDetectionResult> {
    console.log(`🔍 Testing for memory leaks: ${testName}`);
    
    // Reset state
    this.snapshots = [];
    
    // Warmup phase
    for (let i = 0; i < this.options.warmup!; i++) {
      await testFn();
      if (cleanupFn) await cleanupFn();
    }
    
    // Force GC and take baseline
    await this.forceGC();
    this.baselineMemory = process.memoryUsage().heapUsed;
    
    // Main test phase
    for (let i = 0; i < this.options.iterations!; i++) {
      // Run test
      await testFn();
      
      // Take snapshot
      this.takeSnapshot();
      
      // Periodic GC
      if (i % this.options.gcInterval! === 0) {
        await this.forceGC();
      }
      
      // Cleanup
      if (cleanupFn) await cleanupFn();
    }
    
    // Final GC and snapshot
    await this.forceGC();
    this.takeSnapshot();
    
    // Analyze results
    return this.analyzeSnapshots(testName);
  }

  async detectLeaksInSuite(
    packageName: string,
    tests: Array<{
      name: string;
      setup?: () => void | Promise<void>;
      test: () => void | Promise<void>;
      cleanup?: () => void | Promise<void>;
    }>
  ): Promise<MemoryLeakReport> {
    const results: LeakDetectionResult[] = [];
    
    for (const test of tests) {
      if (test.setup) await test.setup();
      
      const result = await this.detectLeak(
        test.name,
        test.test,
        test.cleanup
      );
      
      result.package = packageName;
      results.push(result);
      
      // Log immediate feedback
      this.printResult(result);
    }
    
    return this.generateReport(results);
  }

  private takeSnapshot() {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      rss: usage.rss
    });
  }

  private async forceGC() {
    if (global.gc) {
      global.gc();
      // Wait a bit for GC to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.warn('⚠️  GC not exposed. Run with --expose-gc flag for accurate results.');
    }
  }

  private analyzeSnapshots(testName: string): LeakDetectionResult {
    if (this.snapshots.length < 2) {
      throw new Error('Not enough snapshots for analysis');
    }
    
    // Calculate memory growth
    const memoryValues = this.snapshots.map(s => s.heapUsed / 1024 / 1024); // Convert to MB
    const timeValues = this.snapshots.map((s, i) => i);
    
    // Linear regression to find growth rate
    const regression = this.linearRegression(timeValues, memoryValues);
    const growthRate = regression.slope;
    
    // Calculate correlation coefficient
    const correlation = this.correlationCoefficient(timeValues, memoryValues);
    
    // Determine if it's a leak
    const leaked = growthRate > this.options.threshold! && 
                   Math.abs(correlation) > this.options.confidence!;
    
    // Analyze trend
    const trend = growthRate > 0.01 ? 'increasing' : 
                  growthRate < -0.01 ? 'decreasing' : 'stable';
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(leaked, growthRate, correlation);
    
    return {
      package: '', // Will be set by caller
      test: testName,
      leaked,
      confidence: Math.abs(correlation),
      growthRate,
      snapshots: this.snapshots,
      analysis: {
        trend,
        correlation,
        recommendation
      }
    };
  }

  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private correlationCoefficient(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
    const sumYY = y.reduce((total, yi) => total + yi * yi, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return correlation;
  }

  private generateRecommendation(leaked: boolean, growthRate: number, correlation: number): string {
    if (!leaked && Math.abs(correlation) < 0.5) {
      return '✅ No memory leak detected. Memory usage is stable.';
    }
    
    if (leaked && growthRate > 1) {
      return '🚨 CRITICAL: Severe memory leak detected! Immediate action required.';
    }
    
    if (leaked && growthRate > 0.5) {
      return '⚠️  Significant memory leak detected. Review object lifecycle and cleanup.';
    }
    
    if (leaked) {
      return '⚠️  Possible memory leak detected. Consider profiling for more details.';
    }
    
    if (Math.abs(correlation) > 0.7 && growthRate > 0) {
      return '👀 Memory usage shows consistent growth. Monitor in production.';
    }
    
    return '✅ Memory usage acceptable, but monitor for changes.';
  }

  private printResult(result: LeakDetectionResult) {
    const emoji = result.leaked ? '🚨' : '✅';
    const status = result.leaked ? 'LEAK DETECTED' : 'No leak';
    
    console.log(`  ${emoji} ${result.test}: ${status}`);
    console.log(`     Growth rate: ${result.growthRate.toFixed(3)} MB/iteration`);
    console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`     ${result.analysis.recommendation}`);
  }

  private generateReport(results: LeakDetectionResult[]): MemoryLeakReport {
    const leaks = results.filter(r => r.leaked);
    const suspicious = results.filter(r => !r.leaked && r.confidence > 0.6 && r.growthRate > 0);
    const clean = results.filter(r => !r.leaked && (r.confidence < 0.6 || r.growthRate <= 0));
    
    return {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        leaks: leaks.length,
        suspicious: suspicious.length,
        clean: clean.length
      },
      systemInfo: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  generateMarkdownReport(report: MemoryLeakReport): string {
    let md = '# Memory Leak Detection Report\n\n';
    md += `Generated: ${report.timestamp}\n`;
    md += `Platform: ${report.systemInfo.platform} | Node: ${report.systemInfo.nodeVersion}\n\n`;
    
    // Summary
    md += '## Summary\n\n';
    md += `- Tests analyzed: ${report.summary.total}\n`;
    md += `- 🚨 Memory leaks: ${report.summary.leaks}\n`;
    md += `- 👀 Suspicious: ${report.summary.suspicious}\n`;
    md += `- ✅ Clean: ${report.summary.clean}\n\n`;
    
    // Critical leaks
    const leaks = report.results.filter(r => r.leaked);
    if (leaks.length > 0) {
      md += '## 🚨 Memory Leaks Detected\n\n';
      
      for (const leak of leaks) {
        md += `### ${leak.package} - ${leak.test}\n\n`;
        md += `- **Growth rate**: ${leak.growthRate.toFixed(3)} MB per iteration\n`;
        md += `- **Confidence**: ${(leak.confidence * 100).toFixed(1)}%\n`;
        md += `- **Trend**: ${leak.analysis.trend}\n`;
        md += `- **Recommendation**: ${leak.analysis.recommendation}\n\n`;
        
        // Add memory graph
        md += this.generateMemoryGraph(leak.snapshots);
        md += '\n\n';
      }
    }
    
    // Suspicious patterns
    const suspicious = report.results.filter(r => !r.leaked && r.confidence > 0.6 && r.growthRate > 0);
    if (suspicious.length > 0) {
      md += '## 👀 Suspicious Memory Patterns\n\n';
      
      for (const result of suspicious) {
        md += `- **${result.package}/${result.test}**: ${result.growthRate.toFixed(3)} MB/iter (${(result.confidence * 100).toFixed(1)}% confidence)\n`;
      }
      md += '\n';
    }
    
    return md;
  }

  private generateMemoryGraph(snapshots: MemorySnapshot[]): string {
    // Simple ASCII graph
    const maxMemory = Math.max(...snapshots.map(s => s.heapUsed));
    const minMemory = Math.min(...snapshots.map(s => s.heapUsed));
    const range = maxMemory - minMemory;
    
    let graph = '```\nMemory Usage Over Time:\n';
    
    // Scale to 20 lines
    const height = 10;
    const width = Math.min(snapshots.length, 50);
    
    for (let y = height; y >= 0; y--) {
      const threshold = minMemory + (range * y / height);
      let line = '';
      
      for (let x = 0; x < width; x++) {
        const snapshot = snapshots[Math.floor(x * snapshots.length / width)];
        line += snapshot.heapUsed >= threshold ? '█' : ' ';
      }
      
      graph += line + '\n';
    }
    
    graph += '└' + '─'.repeat(width) + '\n';
    graph += 'Start' + ' '.repeat(Math.max(0, width - 8)) + 'End\n';
    graph += '```';
    
    return graph;
  }

  // Integration with test runners
  createJestReporter() {
    return {
      onTestStart: (test: any) => {
        this.snapshots = [];
        this.takeSnapshot();
      },
      
      onTestResult: async (test: any, result: any) => {
        this.takeSnapshot();
        const analysis = this.analyzeSnapshots(test.path);
        
        if (analysis.leaked) {
          console.error(`Memory leak detected in ${test.path}`);
          process.exitCode = 1;
        }
      }
    };
  }
}