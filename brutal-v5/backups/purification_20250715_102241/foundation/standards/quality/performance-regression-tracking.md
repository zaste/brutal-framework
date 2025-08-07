# Performance Regression Tracking

> Standard for preventing performance degradation across 42 packages through automated tracking and budgets.

## Problem
Small performance regressions accumulate into major slowdowns. Without tracking, a framework can become 3x slower without anyone noticing which specific changes caused it.

## Requirements

### 1. Performance Metrics
Each package must track:
```typescript
export interface PackageMetrics {
  // Size metrics
  bundleSize: {
    raw: number;        // Uncompressed bytes
    gzip: number;       // Gzipped bytes
    brotli: number;     // Brotli compressed bytes
  };
  
  // Runtime metrics
  initialization: {
    cold: number;       // First init (ms)
    warm: number;       // Subsequent init (ms)
    memory: number;     // Memory allocated (KB)
  };
  
  // Operation metrics
  operations: {
    [operation: string]: {
      ops: number;      // Operations per second
      memory: number;   // Memory per operation
      gc: number;       // GC pressure score
    };
  };
}
```

### 2. Performance Budget
```typescript
export interface PerformanceBudget {
  // Absolute limits
  limits: {
    bundleSize: number;      // Max gzipped size
    initTime: number;        // Max cold init ms
    memoryBaseline: number;  // Max idle memory KB
  };
  
  // Regression thresholds
  regression: {
    micro: 0.02,    // 2% - Warning
    minor: 0.05,    // 5% - Requires justification
    major: 0.10,    // 10% - Requires approval
    critical: 0.20  // 20% - Blocks merge
  };
  
  // Accumulated debt
  debt: {
    current: PackageMetrics;
    baseline: PackageMetrics;
    trend: 'improving' | 'stable' | 'degrading';
  };
}
```

### 3. Automated Tracking
```javascript
// .github/workflows/performance.yml
name: Performance Tracking
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Benchmarks
        run: |
          pnpm benchmark:all
          pnpm size:check
          
      - name: Compare with Base
        uses: @brutal/performance-action@v1
        with:
          base-branch: main
          fail-on-regression: major
          
      - name: Update Dashboard
        if: github.ref == 'refs/heads/main'
        run: pnpm perf:upload
```

### 4. Benchmark Suite
```typescript
// packages/@brutal/[package]/benchmark/index.ts
import { Suite } from '@brutal/benchmark';

export const benchmarks = new Suite('[package-name]')
  .add('initialization', {
    fn: () => {
      const component = new Component();
      component.connectedCallback();
    },
    teardown: (component) => {
      component.disconnectedCallback();
    }
  })
  .add('render-simple', {
    fn: (component) => {
      component.render('<div>Hello</div>');
    },
    setup: () => new Component()
  })
  .add('state-update', {
    fn: (component) => {
      component.state = { count: Math.random() };
    },
    setup: () => {
      const c = new Component();
      c.connectedCallback();
      return c;
    }
  });
```

### 5. Performance Report
```typescript
export class PerformanceReporter {
  generateReport(
    current: BenchmarkResult,
    baseline: BenchmarkResult
  ): PerformanceReport {
    const comparison = this.compare(current, baseline);
    
    return {
      summary: {
        status: this.getStatus(comparison),
        regression: comparison.maxRegression,
        improvement: comparison.maxImprovement
      },
      
      details: comparison.operations.map(op => ({
        name: op.name,
        baseline: op.baseline,
        current: op.current,
        change: op.change,
        severity: this.getSeverity(op.change)
      })),
      
      trends: {
        bundleSize: this.getTrend('bundleSize', 30),
        initTime: this.getTrend('initTime', 30),
        memory: this.getTrend('memory', 30)
      },
      
      recommendations: this.getRecommendations(comparison)
    };
  }
}
```

## Implementation

### Package-Level Tracking
```json
// package.json
{
  "scripts": {
    "bench": "brutal-bench run",
    "bench:compare": "brutal-bench compare",
    "size": "brutal-size check",
    "perf:baseline": "brutal-bench save"
  },
  "performance": {
    "budget": {
      "bundleSize": 10000,
      "initTime": 5,
      "memory": 1024
    },
    "benchmarks": "./benchmark/index.ts"
  }
}
```

### CI Integration
```typescript
// tools/performance-check.ts
export async function checkPerformance(pr: PullRequest) {
  // Run benchmarks
  const current = await runBenchmarks();
  const baseline = await getBaseline(pr.base);
  
  // Check for regressions
  const report = reporter.generateReport(current, baseline);
  
  if (report.summary.regression > 0.05) {
    // Post comment on PR
    await github.createComment(pr, {
      body: formatRegressionReport(report)
    });
    
    // Require approval for major regressions
    if (report.summary.regression > 0.10) {
      await github.requestReview(pr, ['performance-team']);
    }
  }
  
  // Update tracking database
  await db.saveMetrics({
    commit: pr.head,
    metrics: current,
    report
  });
}
```

### Performance Dashboard
```typescript
// Real-time performance tracking
export class PerformanceDashboard {
  // Track trends over time
  async getTrends(package: string, days: number) {
    const metrics = await this.db.getMetrics(package, days);
    
    return {
      bundleSize: this.calculateTrend(metrics, 'bundleSize'),
      performance: this.calculateTrend(metrics, 'ops'),
      memory: this.calculateTrend(metrics, 'memory'),
      
      // Identify problem commits
      regressions: this.findRegressions(metrics),
      improvements: this.findImprovements(metrics)
    };
  }
  
  // Alert on degradation
  async checkHealth() {
    const packages = await this.getPackages();
    
    for (const pkg of packages) {
      const trend = await this.getTrends(pkg, 30);
      
      if (trend.bundleSize.slope > 0.01) { // 1% per month
        await this.alert({
          package: pkg,
          issue: 'Bundle size growing',
          trend: trend.bundleSize
        });
      }
    }
  }
}
```

## Validation

- [ ] All packages have benchmarks
- [ ] CI runs benchmarks on every PR
- [ ] Regressions are automatically detected
- [ ] Performance budgets are enforced
- [ ] Trends are tracked over time
- [ ] Alerts fire on degradation

## Example Output

```
Performance Report for @brutal/components

Summary:
  Status: ⚠️  Minor Regression Detected
  Max Regression: 7.2% (render-complex)
  Max Improvement: 3.1% (initialization)

Details:
  initialization:     45ms → 43ms (-4.4%) ✅
  render-simple:      120ms → 125ms (+4.2%) ⚠️
  render-complex:     380ms → 407ms (+7.2%) ⚠️
  state-update:       15ms → 15ms (0%) ✅

Bundle Size:
  Raw: 45KB → 46KB (+2.2%)
  Gzip: 12KB → 12.3KB (+2.5%)

Recommendations:
  - Investigate render-complex regression
  - Consider optimizing template compilation
  - Bundle size approaching budget (12.3KB/15KB)

View detailed analysis: https://perf.brutal.dev/components/abc123
```

## References

- [size-limit](https://github.com/ai/size-limit)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)