# Zero Deviation Automation Pattern

*How to ensure code never deviates from architecture through comprehensive automation*

## Problem
Manual enforcement always fails:
- Developers take shortcuts under pressure
- Reviews miss architectural violations
- Standards drift over time
- "Temporary" hacks become permanent

## Solution
Multi-layered automation that makes deviations impossible, not just discouraged.

## Implementation

### 1. Git Hooks - First Line of Defense
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Fast checks that run in < 2 seconds
echo "🔍 Running pre-commit checks..."

# 1. Syntax check (fastest)
npm run check:syntax || {
  echo "❌ Syntax errors found. Fix them before committing."
  exit 1
}

# 2. Type check (affected files only)
npm run type-check:affected || {
  echo "❌ Type errors found. Fix them before committing."
  exit 1
}

# 3. Lint staged files
npx lint-staged || {
  echo "❌ Linting failed. Fix errors before committing."
  exit 1
}

# 4. Check imports (prevent circular deps)
npm run check:imports:affected || {
  echo "❌ Invalid imports detected. Check dependency rules."
  exit 1
}

echo "✅ Pre-commit checks passed!"
```

```javascript
// .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Comprehensive checks before pushing
echo "🚀 Running pre-push validation..."

# 1. Full type check
npm run type-check || {
  echo "❌ Type check failed"
  exit 1
}

# 2. All tests must pass
npm test || {
  echo "❌ Tests failed"
  exit 1
}

# 3. Architecture alignment
npm run check:architecture || {
  echo "❌ Architecture violations detected"
  exit 1
}

# 4. Bundle size check
npm run check:size || {
  echo "❌ Bundle size exceeds limits"
  exit 1
}

# 5. Security scan
npm audit --production || {
  echo "❌ Security vulnerabilities found"
  exit 1
}

echo "✅ All pre-push checks passed!"
```

### 2. CI/CD Pipeline - No Exceptions
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

jobs:
  validate-structure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Package Structure
        run: |
          node scripts/validate-structure.js
          if [ $? -ne 0 ]; then
            echo "::error::Package structure violations found"
            exit 1
          fi
          
      - name: Check Dependency Rules
        run: |
          node scripts/check-dependencies.js
          if [ $? -ne 0 ]; then
            echo "::error::Dependency rule violations found"
            exit 1
          fi
          
      - name: Validate Architecture Alignment
        run: |
          node scripts/check-architecture.js
          if [ $? -ne 0 ]; then
            echo "::error::Architecture not aligned with specification"
            exit 1
          fi

  quality-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Type Coverage Check
        run: |
          npm run type-check -- --generateCpuProfile
          TYPE_COVERAGE=$(npm run type-coverage --silent)
          if [ "$TYPE_COVERAGE" -lt 100 ]; then
            echo "::error::Type coverage is $TYPE_COVERAGE%, expected 100%"
            exit 1
          fi
          
      - name: Test Coverage Check
        run: |
          npm test -- --coverage
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if [ "$COVERAGE" -lt 95 ]; then
            echo "::error::Test coverage is $COVERAGE%, minimum is 95%"
            exit 1
          fi
          
      - name: Bundle Size Check
        run: |
          npm run build
          npm run size-check
          if [ $? -ne 0 ]; then
            echo "::error::Bundle size exceeds limits"
            exit 1
          fi

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Dependency Audit
        run: |
          npm audit --production
          if [ $? -ne 0 ]; then
            echo "::error::Security vulnerabilities detected"
            exit 1
          fi
          
      - name: License Check
        run: |
          npx license-checker --production --onlyAllow 'MIT;Apache-2.0;BSD'
          if [ $? -ne 0 ]; then
            echo "::error::Incompatible licenses detected"
            exit 1
          fi
          
      - name: SAST Scan
        run: |
          npx semgrep --config=auto
          if [ $? -ne 0 ]; then
            echo "::error::Security issues found in code"
            exit 1
          fi

  performance-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Performance Budget Check
        run: |
          npm run perf:test
          INIT_TIME=$(cat perf-results.json | jq '.initTime')
          if [ "$INIT_TIME" -gt 50 ]; then
            echo "::error::Init time ${INIT_TIME}ms exceeds 50ms limit"
            exit 1
          fi
          
      - name: Memory Usage Check
        run: |
          MEMORY=$(cat perf-results.json | jq '.memoryUsage')
          if [ "$MEMORY" -gt 10485760 ]; then  # 10MB
            echo "::error::Memory usage exceeds 10MB limit"
            exit 1
          fi

  # Block merge if any job fails
  merge-gate:
    needs: [validate-structure, quality-metrics, security-scan, performance-gates]
    runs-on: ubuntu-latest
    steps:
      - name: All Checks Passed
        run: echo "✅ All quality gates passed!"
```

### 3. Automated Code Analysis
```javascript
// scripts/analyze-code-quality.js
import { ESLint } from 'eslint';
import { analyze } from 'ts-morph';

export class CodeQualityAnalyzer {
  async analyze(projectPath) {
    const violations = [];
    
    // 1. Complexity analysis
    const complexity = await this.analyzeComplexity(projectPath);
    complexity.forEach(file => {
      if (file.cyclomatic > 10) {
        violations.push({
          file: file.path,
          type: 'complexity',
          message: `Cyclomatic complexity ${file.cyclomatic} exceeds 10`
        });
      }
    });
    
    // 2. Dependency analysis
    const deps = await this.analyzeDependencies(projectPath);
    deps.forEach(violation => {
      if (violation.circular) {
        violations.push({
          type: 'circular-dependency',
          message: `Circular dependency: ${violation.path}`
        });
      }
    });
    
    // 3. Architecture violations
    const arch = await this.analyzeArchitecture(projectPath);
    arch.forEach(violation => {
      violations.push({
        type: 'architecture',
        message: violation.message
      });
    });
    
    // 4. Pattern violations
    const patterns = await this.analyzePatterns(projectPath);
    patterns.forEach(violation => {
      violations.push({
        type: 'pattern',
        message: violation.message
      });
    });
    
    return violations;
  }
  
  async analyzePatterns(projectPath) {
    const violations = [];
    
    // Check for anti-patterns
    const antiPatterns = [
      {
        name: 'separate-test-dirs',
        pattern: /__tests__|test\/|tests\//,
        message: 'Tests must be colocated with source files'
      },
      {
        name: 'any-type',
        pattern: /:\s*any\b/,
        message: 'Any type is not allowed'
      },
      {
        name: 'console-log',
        pattern: /console\.(log|debug|info)/,
        message: 'Console logs must be removed'
      },
      {
        name: 'todo-comment',
        pattern: /\/\/\s*(TODO|FIXME|HACK)/i,
        message: 'TODO comments must be resolved'
      }
    ];
    
    // Scan all files
    const files = await this.getSourceFiles(projectPath);
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      antiPatterns.forEach(antiPattern => {
        if (antiPattern.pattern.test(content)) {
          violations.push({
            file,
            pattern: antiPattern.name,
            message: antiPattern.message
          });
        }
      });
    }
    
    return violations;
  }
}
```

### 4. Continuous Monitoring
```javascript
// scripts/monitor-deviations.js
export class DeviationMonitor {
  constructor() {
    this.baseline = this.loadBaseline();
    this.thresholds = {
      bundleSize: 1.05,      // 5% increase allowed
      complexity: 1.0,       // No increase allowed
      dependencies: 1.0,     // No new deps allowed
      performance: 0.95      // 5% degradation allowed
    };
  }
  
  async checkForDeviations(currentMetrics) {
    const deviations = [];
    
    // Bundle size deviation
    if (currentMetrics.bundleSize > this.baseline.bundleSize * this.thresholds.bundleSize) {
      deviations.push({
        type: 'bundle-size',
        baseline: this.baseline.bundleSize,
        current: currentMetrics.bundleSize,
        threshold: this.thresholds.bundleSize,
        severity: 'error'
      });
    }
    
    // Complexity deviation
    if (currentMetrics.avgComplexity > this.baseline.avgComplexity * this.thresholds.complexity) {
      deviations.push({
        type: 'complexity',
        baseline: this.baseline.avgComplexity,
        current: currentMetrics.avgComplexity,
        threshold: this.thresholds.complexity,
        severity: 'error'
      });
    }
    
    // New dependencies
    const newDeps = currentMetrics.dependencies.filter(
      dep => !this.baseline.dependencies.includes(dep)
    );
    if (newDeps.length > 0) {
      deviations.push({
        type: 'new-dependencies',
        dependencies: newDeps,
        severity: 'error'
      });
    }
    
    // Performance regression
    if (currentMetrics.performance < this.baseline.performance * this.thresholds.performance) {
      deviations.push({
        type: 'performance',
        baseline: this.baseline.performance,
        current: currentMetrics.performance,
        threshold: this.thresholds.performance,
        severity: 'warning'
      });
    }
    
    return deviations;
  }
  
  async preventDeviations(deviations) {
    const errors = deviations.filter(d => d.severity === 'error');
    
    if (errors.length > 0) {
      console.error('❌ Critical deviations detected:');
      errors.forEach(error => {
        console.error(`  - ${error.type}: ${JSON.stringify(error)}`);
      });
      
      // Block the build/commit/merge
      process.exit(1);
    }
    
    const warnings = deviations.filter(d => d.severity === 'warning');
    if (warnings.length > 0) {
      console.warn('⚠️  Warning deviations detected:');
      warnings.forEach(warning => {
        console.warn(`  - ${warning.type}: ${JSON.stringify(warning)}`);
      });
    }
  }
}
```

### 5. Auto-Fix Where Possible
```javascript
// scripts/auto-fix-violations.js
export class ViolationAutoFixer {
  async fix(violations) {
    let fixed = 0;
    
    for (const violation of violations) {
      switch (violation.type) {
        case 'formatting':
          await this.fixFormatting(violation);
          fixed++;
          break;
          
        case 'imports':
          await this.fixImports(violation);
          fixed++;
          break;
          
        case 'types':
          await this.suggestTypeFix(violation);
          break;
          
        case 'structure':
          await this.fixStructure(violation);
          fixed++;
          break;
      }
    }
    
    console.log(`✅ Auto-fixed ${fixed} violations`);
    console.log(`❗ ${violations.length - fixed} violations require manual fixes`);
    
    return fixed;
  }
  
  async fixImports(violation) {
    // Auto-organize imports
    const file = await this.loadFile(violation.file);
    const imports = this.parseImports(file);
    
    // Sort and group imports
    const organized = this.organizeImports(imports, {
      groups: [
        'builtin',      // Node.js built-ins
        'external',     // npm packages
        'internal',     // @brutal/* packages
        'parent',       // ../ imports
        'sibling',      // ./ imports
        'index'         // ./index imports
      ],
      alphabetize: true,
      removeUnused: true
    });
    
    await this.writeFile(violation.file, organized);
  }
  
  async fixStructure(violation) {
    // Auto-create missing structure
    if (violation.message.includes('Missing test file')) {
      const testFile = violation.file.replace('.ts', '.test.ts');
      const template = this.getTestTemplate(violation.file);
      await this.writeFile(testFile, template);
    }
    
    if (violation.message.includes('Missing types file')) {
      const typesFile = 'types.ts';
      const template = this.getTypesTemplate();
      await this.writeFile(typesFile, template);
    }
  }
}
```

### 6. Branch Protection Rules
```yaml
# GitHub branch protection settings
protection_rules:
  main:
    # Required status checks
    required_status_checks:
      strict: true  # Must be up to date
      contexts:
        - "validate-structure"
        - "quality-metrics"
        - "security-scan"
        - "performance-gates"
        - "bundle-size"
        
    # Required reviews
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
      
    # Restrictions
    restrictions:
      users: []  # No direct push
      teams: []  # No team bypass
      
    # Enforcement
    enforce_admins: true  # Even admins can't bypass
    required_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
```

## Key Insights

### 1. Layer Defense
- Pre-commit: Catch early (< 2s)
- Pre-push: Catch before sharing (< 30s)
- PR: Full validation (< 5min)
- Merge: Final gates

### 2. No Manual Overrides
- Admins can't bypass
- No "emergency" exceptions
- Automation always wins

### 3. Fast Feedback
- Fail at first error
- Clear error messages
- Suggested fixes

### 4. Continuous Evolution
- Monitor trends
- Update baselines
- Tighten over time

## Metrics of Success

- **0** architecture violations merged
- **0** manual quality overrides
- **< 2min** feedback on commits
- **100%** automation coverage
- **> 95%** developer satisfaction

## Anti-patterns to Avoid

### ❌ Optional Checks
```yaml
# BAD
continue-on-error: true

# GOOD
continue-on-error: false
```

### ❌ Manual Gates
```yaml
# BAD
needs: manual-approval

# GOOD
needs: [all-automated-checks]
```

### ❌ Slow Feedback
```bash
# BAD
npm run check:everything  # 10 minutes

# GOOD
npm run check:changed  # 10 seconds
```

## References
- Git hooks best practices
- GitHub Actions documentation
- ESLint custom rules
- V5 automation setup

---

*Automation is the only way to ensure zero deviation.*