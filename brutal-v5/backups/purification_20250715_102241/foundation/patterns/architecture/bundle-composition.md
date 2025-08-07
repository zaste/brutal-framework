# Pattern: Bundle Composition Strategy

## Problem
One-size-fits-all bundles lead to:
- Landing pages loading 150KB for a button
- Apps missing features they need
- No middle ground between "too little" and "too much"
- Poor tree-shaking due to circular dependencies

## Context
Use this pattern when:
- Different use cases need different features
- Performance budgets vary by application
- Users need predictable bundle sizes
- Custom bundles are required

## Solution
Predefined bundles with explicit composition, plus support for custom bundles via configuration.

## Implementation

### 1. Bundle Definitions
```javascript
// packages/bundles/src/definitions.js
export const BUNDLE_DEFINITIONS = {
  // Minimal - Landing pages, marketing sites
  lite: {
    packages: [
      '@brutal/foundation',    // 6KB - Registry, config, polyfills
      '@brutal/shared',        // 4KB - Core utilities
      '@brutal/templates',     // 7KB - Template engine
      '@brutal/components'     // 1KB - Base component only
    ],
    maxSize: 15 * 1024,  // 15KB
    target: 'es2020'
  },
  
  // Standard - Single Page Applications  
  core: {
    packages: [
      ...BUNDLE_DEFINITIONS.lite.packages,
      '@brutal/events',      // 5KB - Event system
      '@brutal/state',       // 6KB - State management
      '@brutal/routing',     // 6KB - SPA routing
      '@brutal/cache',       // 5KB - Multi-layer cache
      '@brutal/scheduling',  // 3KB - DOM scheduler
      '@brutal/a11y',       // 4KB - Accessibility
      '@brutal/plugins'     // 4KB - Plugin system
    ],
    maxSize: 35 * 1024,  // 35KB
    target: 'es2020'
  },
  
  // Enhanced - Complex applications
  enhanced: {
    packages: [
      ...BUNDLE_DEFINITIONS.core.packages,
      '@brutal/enhanced-components',  // 10KB
      '@brutal/enhanced-state',       // 8KB
      '@brutal/enhanced-routing'      // 7KB
    ],
    maxSize: 50 * 1024,  // 50KB
    target: 'es2020'
  }
};
```

### 2. Build-time Bundle Creation
```javascript
// scripts/build-bundles.js
import { rollup } from 'rollup';
import { BUNDLE_DEFINITIONS } from '../packages/bundles/definitions.js';

async function buildBundle(name, definition) {
  const input = createVirtualEntry(definition.packages);
  
  const bundle = await rollup({
    input,
    plugins: [
      resolvePackages(),
      treeShake(),
      minify()
    ],
    external: []  // No external deps!
  });
  
  const { output } = await bundle.generate({
    format: 'es',
    compact: true
  });
  
  // Validate size
  const size = output[0].code.length;
  if (size > definition.maxSize) {
    throw new Error(
      `Bundle ${name} exceeds size limit: ${size} > ${definition.maxSize}`
    );
  }
  
  return output[0].code;
}

// Virtual entry point
function createVirtualEntry(packages) {
  return packages
    .map(pkg => `export * from '${pkg}';`)
    .join('\n');
}
```

### 3. Custom Bundle Support
```javascript
// brutal.config.js - User configuration
export default {
  // Option 1: Extend existing
  bundle: {
    extends: 'core',
    add: ['@brutal/forms', '@brutal/animation'],
    remove: ['@brutal/cache']  // Not needed
  },
  
  // Option 2: Explicit packages
  bundle: [
    '@brutal/foundation',
    '@brutal/components', 
    '@brutal/state',
    '@brutal/forms'
  ],
  
  // Option 3: Multiple bundles
  bundles: {
    'app.js': {
      extends: 'core',
      add: ['@brutal/forms']
    },
    'landing.js': 'lite',
    'admin.js': 'full'
  }
};
```

### 4. Bundle Validation
```javascript
// scripts/validate-bundles.js
export function validateBundle(packages) {
  const graph = buildDependencyGraph(packages);
  
  // Check for missing dependencies
  const missing = findMissingDependencies(graph);
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing}`);
  }
  
  // Check for circular dependencies
  const cycles = findCycles(graph);
  if (cycles.length > 0) {
    throw new Error(`Circular dependencies: ${cycles}`);
  }
  
  // Estimate size
  const estimatedSize = packages.reduce((sum, pkg) => 
    sum + PACKAGE_SIZES[pkg], 0
  );
  
  return { valid: true, estimatedSize };
}
```

### 5. Import Resolution
```javascript
// CDN usage
<script type="module">
  import { Component, html, createState } from 'https://unpkg.com/brutal/dist/brutal-core.js';
</script>

// NPM usage with bundler
import { Component } from 'brutal';  // Uses package.json exports

// Direct package import
import { Component } from '@brutal/components';
```

### 6. Package.json Exports Map
```json
{
  "name": "brutal",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/brutal-core.js",
      "require": "./dist/brutal-core.cjs"
    },
    "./lite": {
      "types": "./dist/lite.d.ts",
      "import": "./dist/brutal-lite.js"
    },
    "./full": {
      "types": "./dist/full.d.ts", 
      "import": "./dist/brutal-full.js"
    },
    "./*": {
      "types": "./packages/*/dist/index.d.ts",
      "import": "./packages/*/dist/index.js"
    }
  }
}
```

## Key Insights

### 1. Explicit is Better
- Clear what's in each bundle
- No hidden dependencies
- Predictable sizes

### 2. Composition Over Configuration
- Bundles compose from packages
- Not configured with flags
- Tree-shaking works properly

### 3. Size Budget Enforcement
- Build fails if over budget
- No "just this once"
- Performance is a feature

## Trade-offs

✅ **Benefits**:
- Right-sized bundles
- Clear composition
- Custom bundle support
- Predictable performance

⚠️ **Considerations**:
- Multiple build artifacts
- More complex build
- Documentation needed
- Version coordination

## Bundle Decision Matrix

| Use Case | Bundle | Size | Includes |
|----------|--------|------|----------|
| Landing page | lite | 15KB | Templates, Components |
| SPA | core | 35KB | + State, Routing, Events |
| Complex app | enhanced | 50KB | + Advanced features |
| Full platform | full | 150KB | Everything |
| Custom | config | Varies | Your choice |

## References
- V5: foundation/archive/reference/BUNDLE-MAP.md
- Build: rollup configuration
- Prior art: Preact's build system

---

*Ship exactly what's needed, nothing more.*