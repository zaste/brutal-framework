# Pattern: Automated Quality Gates

## Problem
Manual quality enforcement fails because:
- Developers forget to run tests
- Code reviews miss issues
- Standards drift over time
- "Just this once" becomes permanent

## Context
Use automated gates when:
- Quality is non-negotiable
- Team is distributed
- Consistency matters
- Manual review isn't scalable

## Solution
Enforce quality through automation at multiple stages, making it impossible to merge low-quality code.

## Implementation

### 1. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,ts}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

### 2. CI/CD Quality Gates
```yaml
# .github/workflows/quality.yml
name: Quality Gates
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Type Check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint -- --max-warnings=0
        
      - name: Test with Coverage
        run: npm test -- --coverage
        
      - name: Coverage Gate
        uses: codecov/codecov-action@v3
        with:
          fail_ci_if_error: true
          threshold: 95%
          
      - name: Bundle Size Check
        run: npm run size-check
        env:
          SIZE_LIMIT: 35KB
          
      - name: Performance Check
        run: npm run perf-check
        env:
          INIT_TIME_LIMIT: 50ms
```

### 3. Automated PR Checks
```javascript
// danger.js - Automated PR review
import { danger, fail, warn } from 'danger';

// Check PR size
if (danger.github.pr.additions > 500) {
  warn('Large PR - consider breaking it up');
}

// Ensure tests for new code
const hasNewCode = danger.git.created_files.some(f => 
  f.endsWith('.js') || f.endsWith('.ts')
);
const hasNewTests = danger.git.created_files.some(f => 
  f.includes('.test.')
);

if (hasNewCode && !hasNewTests) {
  fail('New code requires tests');
}

// Check bundle impact
const sizeReport = require('./size-report.json');
if (sizeReport.increase > 1024) { // 1KB
  warn(`Bundle size increased by ${sizeReport.increase} bytes`);
}
```

### 4. Quality Metrics Dashboard
```javascript
// scripts/quality-report.js
export async function generateQualityReport() {
  const metrics = {
    coverage: await getCoverage(),
    bundleSize: await getBundleSize(),
    performance: await getPerformance(),
    typesCoverage: await getTypesCoverage(),
    dependencies: await checkDependencies()
  };
  
  // Block if any metric fails
  const failures = Object.entries(metrics)
    .filter(([_, value]) => !value.passes)
    .map(([name, value]) => `${name}: ${value.actual} (required: ${value.required})`);
    
  if (failures.length > 0) {
    console.error('Quality gates failed:', failures);
    process.exit(1);
  }
}
```

### 5. Enforcement Configuration
```javascript
// quality.config.js
export const QUALITY_REQUIREMENTS = {
  coverage: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  },
  bundle: {
    '@brutal/foundation': 6 * 1024,      // 6KB
    '@brutal/shared': 4 * 1024,          // 4KB
    '@brutal/core': 35 * 1024,           // 35KB total
  },
  performance: {
    initTime: 50,    // ms
    firstPaint: 100, // ms
    memoryUsage: 10 * 1024 * 1024  // 10MB
  },
  complexity: {
    cyclomatic: 10,
    cognitive: 15,
    maxDepth: 3,
    maxLines: 300,
    maxParams: 3
  }
};
```

## Key Insights

### 1. Multiple Checkpoints
- Pre-commit: Catch early
- PR checks: Validate changes
- Main branch: Final gate
- Release: Production ready

### 2. No Manual Overrides
```yaml
# Branch protection rules
- Require status checks to pass
- Require branches to be up to date
- Include administrators  # Even admins can't bypass
```

### 3. Fast Feedback
- Run fastest checks first
- Parallelize where possible
- Cache dependencies
- Fail fast on first error

## Trade-offs

✅ **Benefits**:
- Consistent quality
- No human error
- Clear requirements
- Historical tracking

⚠️ **Considerations**:
- Initial setup time
- CI/CD minutes cost
- Can block urgent fixes
- Requires maintenance

## Common Pitfalls

### ❌ Skippable Gates
```bash
# BAD: Allow skipping
npm test -- --passWithNoTests

# GOOD: Fail if no tests
npm test -- --coverage --coverageThreshold='{"global":{"branches":95}}'
```

### ❌ Warning Fatigue
```javascript
// BAD: Too many warnings
warn('Consider adding types');  // Ignored

// GOOD: Fail on important things
fail('Missing types for public API');  // Blocked
```

## Metrics of Success

- **0** low-quality merges
- **100%** of PRs pass gates
- **< 2min** feedback time
- **95%+** developer satisfaction

## References
- V5: QUALITY-STANDARDS.md
- Tools: Husky, lint-staged, Danger.js, GitHub Actions
- Inspiration: Google's testing blog, Facebook's CI/CD

---

*Quality enforced is quality ensured.*