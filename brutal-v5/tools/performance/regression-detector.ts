/**
 * Performance Regression Detection System
 * 
 * Automatically detects performance regressions by comparing
 * benchmark results against historical data
 */

import { BenchmarkResult, BenchmarkSuite } from './benchmark-suite.js';

export interface RegressionThresholds {
  error: number;    // % decrease that triggers error
  warning: number;  // % decrease that triggers warning
  improvement: number; // % increase considered significant improvement
}

export interface RegressionResult {
  benchmark: string;
  package: string;
  current: BenchmarkResult;
  baseline: BenchmarkResult;
  change: number; // Percentage change
  severity: 'error' | 'warning' | 'ok' | 'improved';
  significant: boolean;
  message: string;
}

export interface RegressionReport {
  timestamp: string;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    improvements: number;
    ok: number;
  };
  regressions: RegressionResult[];
  recommendations: string[];
}

export class RegressionDetector {
  private thresholds: RegressionThresholds;
  private history: Map<string, BenchmarkResult[]> = new Map();

  constructor(thresholds: Partial<RegressionThresholds> = {}) {
    this.thresholds = {
      error: 10,      // 10% regression = error
      warning: 5,     // 5% regression = warning  
      improvement: 5, // 5% improvement = significant
      ...thresholds
    };
  }

  async loadHistory(historyPath: string) {
    try {
      const { readFile } = await import('fs/promises');
      const data = await readFile(historyPath, 'utf-8');
      const history = JSON.parse(data);
      
      // Convert to Map structure
      for (const suite of history.suites || []) {
        for (const benchmark of suite.benchmarks) {
          const key = `${suite.package}:${benchmark.name}`;
          if (!this.history.has(key)) {
            this.history.set(key, []);
          }
          this.history.get(key)!.push(benchmark);
        }
      }
    } catch (error) {
      console.warn('⚠️  No benchmark history found, starting fresh');
    }
  }

  detectRegressions(
    current: Map<string, BenchmarkSuite>,
    baseline: Map<string, BenchmarkSuite>
  ): RegressionReport {
    const regressions: RegressionResult[] = [];
    
    for (const [suiteName, currentSuite] of current) {
      const baselineSuite = baseline.get(suiteName);
      if (!baselineSuite) continue;
      
      for (const currentBench of currentSuite.benchmarks) {
        const baselineBench = baselineSuite.benchmarks.find(
          b => b.name === currentBench.name
        );
        
        if (!baselineBench) continue;
        
        const result = this.analyzeBenchmark(
          currentSuite.package,
          currentBench,
          baselineBench
        );
        
        if (result) {
          regressions.push(result);
        }
      }
    }

    const report = this.generateReport(regressions);
    return report;
  }

  private analyzeBenchmark(
    packageName: string,
    current: BenchmarkResult,
    baseline: BenchmarkResult
  ): RegressionResult | null {
    // Calculate percentage change (positive = improvement)
    const change = ((current.ops - baseline.ops) / baseline.ops) * 100;
    
    // Determine if change is statistically significant
    const significant = this.isSignificant(current, baseline);
    
    // Determine severity
    let severity: RegressionResult['severity'] = 'ok';
    if (change <= -this.thresholds.error) {
      severity = 'error';
    } else if (change <= -this.thresholds.warning) {
      severity = 'warning';
    } else if (change >= this.thresholds.improvement) {
      severity = 'improved';
    }
    
    // Only report significant changes or any errors
    if (!significant && severity !== 'error') {
      return null;
    }

    const message = this.generateMessage(current.name, change, severity, significant);

    return {
      benchmark: current.name,
      package: packageName,
      current,
      baseline,
      change,
      severity,
      significant,
      message
    };
  }

  private isSignificant(current: BenchmarkResult, baseline: BenchmarkResult): boolean {
    // Use confidence intervals to determine significance
    const currentRange = [
      current.mean - current.confidence,
      current.mean + current.confidence
    ];
    
    const baselineRange = [
      baseline.mean - baseline.confidence,
      baseline.mean + baseline.confidence
    ];
    
    // If ranges don't overlap, change is significant
    return currentRange[1] < baselineRange[0] || currentRange[0] > baselineRange[1];
  }

  private generateMessage(
    benchmark: string,
    change: number,
    severity: RegressionResult['severity'],
    significant: boolean
  ): string {
    const absChange = Math.abs(change);
    const direction = change > 0 ? 'faster' : 'slower';
    const sigStr = significant ? ' (statistically significant)' : '';
    
    switch (severity) {
      case 'error':
        return `🚨 CRITICAL: ${benchmark} is ${absChange.toFixed(1)}% ${direction}${sigStr}`;
      case 'warning':
        return `⚠️  WARNING: ${benchmark} is ${absChange.toFixed(1)}% ${direction}${sigStr}`;
      case 'improved':
        return `🎉 IMPROVED: ${benchmark} is ${absChange.toFixed(1)}% ${direction}${sigStr}`;
      default:
        return `✓ OK: ${benchmark} performance is stable`;
    }
  }

  private generateReport(regressions: RegressionResult[]): RegressionReport {
    const summary = {
      total: regressions.length,
      errors: regressions.filter(r => r.severity === 'error').length,
      warnings: regressions.filter(r => r.severity === 'warning').length,
      improvements: regressions.filter(r => r.severity === 'improved').length,
      ok: regressions.filter(r => r.severity === 'ok').length
    };

    const recommendations = this.generateRecommendations(regressions);

    return {
      timestamp: new Date().toISOString(),
      summary,
      regressions: regressions.sort((a, b) => {
        // Sort by severity: error > warning > ok > improved
        const severityOrder = { error: 0, warning: 1, ok: 2, improved: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      recommendations
    };
  }

  private generateRecommendations(regressions: RegressionResult[]): string[] {
    const recommendations: string[] = [];
    
    // Check for critical regressions
    const errors = regressions.filter(r => r.severity === 'error');
    if (errors.length > 0) {
      recommendations.push(
        `🚨 ${errors.length} critical performance regression(s) detected. Immediate action required!`
      );
      
      // Group by package
      const packageErrors = new Map<string, number>();
      errors.forEach(e => {
        packageErrors.set(e.package, (packageErrors.get(e.package) || 0) + 1);
      });
      
      for (const [pkg, count] of packageErrors) {
        recommendations.push(
          `   - Review recent changes to ${pkg} (${count} regression${count > 1 ? 's' : ''})`
        );
      }
    }

    // Check for warnings
    const warnings = regressions.filter(r => r.severity === 'warning');
    if (warnings.length > 0) {
      recommendations.push(
        `⚠️  ${warnings.length} performance warning(s) detected. Monitor closely.`
      );
    }

    // Check for improvements
    const improvements = regressions.filter(r => r.severity === 'improved');
    if (improvements.length > 0) {
      recommendations.push(
        `🎉 ${improvements.length} performance improvement(s) detected! Good work!`
      );
    }

    // Historical trend analysis
    const trends = this.analyzeTrends(regressions);
    recommendations.push(...trends);

    return recommendations;
  }

  private analyzeTrends(regressions: RegressionResult[]): string[] {
    const trends: string[] = [];
    
    // Check for consistent degradation
    for (const regression of regressions) {
      const key = `${regression.package}:${regression.benchmark}`;
      const history = this.history.get(key) || [];
      
      if (history.length >= 3) {
        // Check last 3 results for consistent degradation
        const recent = history.slice(-3);
        const declining = recent.every((result, i) => {
          if (i === 0) return true;
          return result.ops < recent[i - 1].ops;
        });
        
        if (declining) {
          trends.push(
            `📉 ${regression.benchmark} in ${regression.package} shows consistent degradation over last ${recent.length} runs`
          );
        }
      }
    }
    
    return trends;
  }

  async saveReport(report: RegressionReport, outputPath: string) {
    const { writeFile } = await import('fs/promises');
    await writeFile(outputPath, JSON.stringify(report, null, 2));
  }

  generateMarkdownReport(report: RegressionReport): string {
    let md = '# Performance Regression Report\n\n';
    md += `Generated: ${report.timestamp}\n\n`;
    
    // Summary
    md += '## Summary\n\n';
    md += `- Total benchmarks analyzed: ${report.summary.total}\n`;
    md += `- 🚨 Critical regressions: ${report.summary.errors}\n`;
    md += `- ⚠️  Warnings: ${report.summary.warnings}\n`;
    md += `- 🎉 Improvements: ${report.summary.improvements}\n`;
    md += `- ✓ Stable: ${report.summary.ok}\n\n`;
    
    // Recommendations
    if (report.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      report.recommendations.forEach(rec => {
        md += `${rec}\n`;
      });
      md += '\n';
    }
    
    // Detailed results
    if (report.regressions.length > 0) {
      md += '## Detailed Results\n\n';
      
      // Group by severity
      const grouped = new Map<string, RegressionResult[]>();
      report.regressions.forEach(r => {
        const group = grouped.get(r.severity) || [];
        group.push(r);
        grouped.set(r.severity, group);
      });
      
      for (const [severity, results] of grouped) {
        if (results.length === 0) continue;
        
        const title = {
          error: '### 🚨 Critical Regressions',
          warning: '### ⚠️  Performance Warnings',
          improved: '### 🎉 Performance Improvements',
          ok: '### ✓ Stable Performance'
        }[severity];
        
        md += `${title}\n\n`;
        
        md += '| Package | Benchmark | Current | Baseline | Change | Significant |\n';
        md += '|---------|-----------|---------|----------|--------|-------------|\n';
        
        for (const result of results) {
          const sigMark = result.significant ? '✓' : '';
          md += `| ${result.package} | ${result.benchmark} | ${result.current.ops.toLocaleString()} ops/s | ${result.baseline.ops.toLocaleString()} ops/s | ${result.change > 0 ? '+' : ''}${result.change.toFixed(1)}% | ${sigMark} |\n`;
        }
        
        md += '\n';
      }
    }
    
    return md;
  }

  // CI/CD integration helper
  shouldFailBuild(report: RegressionReport): boolean {
    return report.summary.errors > 0;
  }

  getExitCode(report: RegressionReport): number {
    if (report.summary.errors > 0) return 1;
    if (report.summary.warnings > 0) return 2;
    return 0;
  }
}