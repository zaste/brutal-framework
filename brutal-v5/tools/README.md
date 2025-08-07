# BRUTAL V5 Tooling Suite

> Zero-dependency development tools for the BRUTAL ecosystem

## Overview

The BRUTAL V5 Tooling Suite provides comprehensive development tools while maintaining BRUTAL's core philosophy of **zero external dependencies**. Built over a 4-week sprint, these tools enable confident releases, smooth upgrades, and a secure plugin ecosystem.

## Installation

```bash
npm install @brutal/tools --save-dev
```

## Quick Start

```typescript
import {
  VersionValidator,
  BenchmarkSuite,
  BreakingChangeAnalyzer,
  PluginCertifier
} from '@brutal/tools';

// Validate version compatibility
const validator = new VersionValidator();
const result = await validator.validatePackage('./my-package');

// Benchmark performance
const suite = new BenchmarkSuite('my-suite');
suite.add('operation', () => myFunction());
const benchmarks = await suite.run();

// Detect breaking changes
const analyzer = new BreakingChangeAnalyzer();
const changes = await analyzer.analyzePackage('./pkg', '1.0.0', '2.0.0');

// Certify plugins
const certifier = new PluginCertifier();
const cert = await certifier.certifyPlugin('./my-plugin');
```

## Tool Categories

### 🔧 Version Compatibility Tools

Ensure your code works across different environments and versions.

- **Version Validator** - Validate semantic versions and dependencies
- **Compatibility Matrix** - Generate visual compatibility charts
- **Install Validator** - Pre-installation compatibility checks
- **Runtime Guard** - Runtime environment validation

[Documentation →](./compatibility/README.md)

### ⚡ Performance Monitoring Tools

Track and optimize your application's performance.

- **Benchmark Suite** - Statistical performance benchmarking
- **Regression Detector** - Automatic performance regression detection
- **Bundle Tracker** - Monitor package sizes with compression analysis
- **Memory Leak Detector** - Detect memory leaks using linear regression

[Documentation →](./performance/README.md)

### 🔄 Migration & Breaking Change Tools

Make version upgrades smooth and predictable.

- **Breaking Change Analyzer** - AST-based breaking change detection
- **Migration Generator** - Automated migration script creation
- **API Surface Tracker** - Track and document your public API
- **Cross-Package Analyzer** - Analyze impact across dependencies

[Documentation →](./migration/README.md)

### 🔒 Security & Certification Tools

Ensure plugin safety and documentation quality.

- **Security Sandbox** - Isolated code execution environment
- **Permission System** - Fine-grained permission management
- **Plugin Certifier** - Automated security analysis and certification
- **Documentation Validator** - Quality and security checks for docs

[Documentation →](./security/README.md)

## Integration Example

Here's how to use multiple tools together in your development workflow:

```typescript
import {
  VersionValidator,
  BenchmarkSuite,
  BreakingChangeAnalyzer,
  APISurfaceTracker,
  PluginCertifier,
  DocumentationValidator
} from '@brutal/tools';

async function preReleaseChecks(packagePath: string, previousVersion: string, newVersion: string) {
  console.log('🚀 Running pre-release checks...\n');
  
  // 1. Validate version compatibility
  const versionValidator = new VersionValidator();
  const versionCheck = await versionValidator.validatePackage(packagePath);
  
  if (!versionCheck.valid) {
    console.error('❌ Version validation failed:', versionCheck.errors);
    return false;
  }
  
  // 2. Check for breaking changes
  const changeAnalyzer = new BreakingChangeAnalyzer();
  const changes = await changeAnalyzer.analyzePackage(
    packagePath,
    previousVersion,
    newVersion
  );
  
  if (changes.summary.breakingChanges > 0) {
    console.warn('⚠️  Breaking changes detected:', changes.summary);
    // Generate migration guide
    const migration = await generateMigrationGuide(changes);
    console.log('📝 Migration guide generated');
  }
  
  // 3. Track API surface
  const apiTracker = new APISurfaceTracker();
  const apiSurface = await apiTracker.trackPackage(packagePath);
  await apiTracker.generateReport(apiSurface, './api-report.md');
  
  // 4. Run performance benchmarks
  const benchmarks = new BenchmarkSuite('release-benchmarks');
  // Add your benchmarks here
  const perfResults = await benchmarks.run();
  
  // 5. Validate documentation
  const docValidator = new DocumentationValidator();
  const docCheck = await docValidator.validateDocumentation(packagePath);
  
  if (!docCheck.valid) {
    console.warn('⚠️  Documentation issues:', docCheck.summary);
  }
  
  // 6. Security certification (for plugins)
  if (isPlugin(packagePath)) {
    const certifier = new PluginCertifier();
    const cert = await certifier.certifyPlugin(packagePath);
    
    if (!cert.certified) {
      console.error('❌ Plugin certification failed:', cert.recommendations);
      return false;
    }
  }
  
  console.log('✅ All pre-release checks passed!');
  return true;
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: BRUTAL Tools Check

on: [push, pull_request]

jobs:
  brutal-tools:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run BRUTAL Tools
        run: |
          npx brutal-tools version-check
          npx brutal-tools benchmark --compare-with main
          npx brutal-tools breaking-changes --base main
          npx brutal-tools certify-plugin
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "brutal-tools lint-docs && brutal-tools check-compatibility"
    }
  }
}
```

## Configuration

Create a `.brutalrc.json` file in your project root:

```json
{
  "tools": {
    "compatibility": {
      "node": ">=18.0.0",
      "brutal": "^5.0.0"
    },
    "performance": {
      "regression": {
        "errorThreshold": 0.1,
        "warningThreshold": 0.05
      }
    },
    "security": {
      "sandbox": {
        "timeout": 5000,
        "maxMemory": 256
      }
    },
    "migration": {
      "tracking": {
        "includePrivate": false,
        "outputFormat": "markdown"
      }
    }
  }
}
```

## Advanced Usage

### Custom Tool Integration

```typescript
import { BenchmarkSuite, RegressionDetector, BundleTracker } from '@brutal/tools';

class PerformanceMonitor {
  private suite: BenchmarkSuite;
  private detector: RegressionDetector;
  private tracker: BundleTracker;
  
  constructor(name: string) {
    this.suite = new BenchmarkSuite(name);
    this.detector = new RegressionDetector({
      errorThreshold: 0.15,
      warningThreshold: 0.10
    });
    this.tracker = new BundleTracker();
  }
  
  async runFullAnalysis(packagePath: string) {
    // Run benchmarks
    const benchResults = await this.suite.run();
    
    // Check for regressions
    const baseline = await this.loadBaseline();
    const regressions = this.detector.detectRegressions(baseline, benchResults);
    
    // Track bundle size
    const bundleMetrics = await this.tracker.analyzePackage(packagePath);
    
    return {
      performance: benchResults,
      regressions,
      bundleSize: bundleMetrics
    };
  }
}
```

### Plugin Development

```typescript
import { 
  PermissionSystem, 
  SecuritySandbox,
  PluginCertifier 
} from '@brutal/tools';

// Define your plugin's permissions
const permissions = {
  name: 'my-plugin',
  version: '1.0.0',
  permissions: {
    required: [
      {
        id: 'api.brutal.core',
        type: 'api',
        scope: { api: { brutal: ['core'] } },
        description: 'Core API access',
        risk: 'low'
      }
    ]
  }
};

// Test in sandbox
const sandbox = new SecuritySandbox({
  permissions: {
    apis: { console: true },
    resources: { timeoutMs: 5000 }
  }
});

const result = await sandbox.execute(pluginCode, context);

// Get certified
const certifier = new PluginCertifier();
const certification = await certifier.certifyPlugin('./my-plugin');
```

## Performance Considerations

All tools are designed for minimal overhead:

- **Zero dependencies** (except TypeScript for migration tools)
- **Lazy loading** of tool modules
- **Streaming APIs** for large datasets
- **Worker threads** for CPU-intensive operations
- **Efficient caching** strategies

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © BRUTAL Team

---

<div align="center">

**[Documentation](./docs)** • **[Examples](./examples)** • **[API Reference](./api)** • **[Changelog](./CHANGELOG.md)**

</div>