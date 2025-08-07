# Performance Budgets Pattern

## Problem
Performance degrades over time without strict enforcement. Manual performance checks are inconsistent and often ignored under deadline pressure.

## Solution
Automated performance budgets enforced in CI/CD that block merges when performance thresholds are exceeded.

### Budget Configuration
```yaml
# .github/workflows/performance.yml
budgets:
  - package: '@brutal/foundation'
    maxSize: '6KB'
    maxTTI: '50ms'    # Time to Interactive
    maxFCP: '50ms'    # First Contentful Paint
    
  - package: '@brutal/core'
    maxSize: '35KB'
    maxTTI: '300ms'
    maxFCP: '100ms'
    maxMemory: '10MB'
    
  - package: '@brutal/enhanced'
    maxSize: '50KB'
    maxTTI: '500ms'
    maxFCP: '150ms'
    maxCLS: 0.1       # Cumulative Layout Shift
```

### Measurement Implementation
```javascript
// performance-budget-validator.js
export class PerformanceBudgetValidator {
  async validatePackage(packageName, budgets) {
    const metrics = await this.measurePackage(packageName);
    const violations = [];
    
    // Check size
    if (metrics.size > budgets.maxSize) {
      violations.push({
        metric: 'size',
        actual: metrics.size,
        budget: budgets.maxSize,
        delta: metrics.size - budgets.maxSize
      });
    }
    
    // Check performance metrics
    if (metrics.tti > budgets.maxTTI) {
      violations.push({
        metric: 'TTI',
        actual: metrics.tti,
        budget: budgets.maxTTI,
        delta: metrics.tti - budgets.maxTTI
      });
    }
    
    return violations;
  }
  
  async measurePackage(packageName) {
    // Use Puppeteer for real browser metrics
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Enable performance APIs
    await page.evaluateOnNewDocument(() => {
      window.__PERF_START__ = performance.now();
    });
    
    // Load package
    await page.goto(`test:///${packageName}`);
    
    // Collect metrics
    const metrics = await page.evaluate(() => ({
      tti: performance.now() - window.__PERF_START__,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      memory: performance.memory?.usedJSHeapSize,
      cls: calculateCLS()
    }));
    
    await browser.close();
    return metrics;
  }
}
```

### CI Integration
```yaml
# GitHub Actions job
performance-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    - name: Build packages
      run: pnpm build
    
    - name: Check performance budgets
      run: |
        node scripts/check-performance-budgets.js
        
    - name: Upload results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-results.json
        
    - name: Comment PR
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          const results = require('./performance-results.json');
          const comment = formatPerformanceReport(results);
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### Performance Tracking
```javascript
// Track performance over time
class PerformanceTracker {
  async recordMetrics(packageName, metrics) {
    const history = await this.loadHistory(packageName);
    
    history.push({
      timestamp: Date.now(),
      commit: process.env.GITHUB_SHA,
      metrics
    });
    
    // Detect regressions
    const regression = this.detectRegression(history);
    if (regression) {
      throw new Error(`Performance regression detected: ${regression}`);
    }
    
    await this.saveHistory(packageName, history);
  }
  
  detectRegression(history) {
    if (history.length < 2) return null;
    
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    
    // Allow 10% variance
    const threshold = 1.1;
    
    for (const [key, value] of Object.entries(current.metrics)) {
      if (value > previous.metrics[key] * threshold) {
        return `${key} increased by ${Math.round((value / previous.metrics[key] - 1) * 100)}%`;
      }
    }
    
    return null;
  }
}
```

## Evolution
- V3: No performance tracking
- V4: Manual performance tests
- V5: Automated budgets with CI enforcement

## Trade-offs
- ✅ Performance guaranteed
- ✅ Regression prevention
- ✅ Historical tracking
- ✅ Team accountability
- ❌ CI complexity
- ❌ False positives possible

## Related
- [Bundle Optimization](../build/bundle-optimization.md)
- [Quality Gates](../quality/quality-gates.md)
- [V8 Optimization](./v8-optimization.md)