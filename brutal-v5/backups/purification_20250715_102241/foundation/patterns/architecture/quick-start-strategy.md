# Pattern: Quick Start Strategy

## Problem
Developers need multiple entry points to adopt a framework:
- Complete app scaffolding for new projects
- Package installation for existing projects
- CDN usage for prototypes
- Clear migration paths from older versions

## Solution
Provide three distinct adoption paths with consistent developer experience.

## Implementation

### 1. CLI Scaffolding
```bash
npx create-brutal-app my-app [options]

Options:
  --bundle    lite|core|enhanced|ui|full (default: core)
  --template  spa|mpa|pwa|static (default: spa)
  --typescript  Enable TypeScript (default: true)
  --testing   jest|vitest|none (default: jest)
  --style     css|scss|postcss (default: css)
```

### 2. Package Installation
```bash
# Minimal installation
npm install @brutal/core

# Common combinations
npm install @brutal/core @brutal/forms @brutal/routing

# Bundle equivalents
npm install @brutal/bundle-lite    # 15KB
npm install @brutal/bundle-core    # 35KB
npm install @brutal/bundle-enhanced # 50KB
```

### 3. CDN Usage
```html
<!-- Development (unminified with source maps) -->
<script src="https://unpkg.com/brutal/brutal-core.dev.js"></script>

<!-- Production (minified + gzipped) -->
<script src="https://unpkg.com/brutal/brutal-core.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/brutal@5.0.0/brutal-core.js"></script>

<!-- ES Modules -->
<script type="module">
  import { Component, html } from 'https://unpkg.com/brutal/brutal-core.mjs';
</script>
```

## Bundle Strategy Alignment

Maps to [Bundle Composition](./bundle-composition.md):
- `brutal-lite.js` → Landing pages, blogs
- `brutal-core.js` → SPAs, dashboards  
- `brutal-enhanced.js` → Complex applications
- `brutal-ui.js` → With component library
- `brutal-full.js` → Kitchen sink

## Migration Paths

### From V3 (Monolithic)
```javascript
// V3: Single import
import Brutal from 'brutal-v3';

// V5: Modular imports
import { Component } from '@brutal/components';
import { createState } from '@brutal/state';
import { Router } from '@brutal/routing';
```

### From V4 (10% Complete)
```javascript
// V4 and V5 share similar APIs
// Main change is package paths
import { Component } from '@brutal-v4/core';
// becomes
import { Component } from '@brutal/components';
```

## Developer Experience

### Zero Config Start
```bash
npx create-brutal-app my-app
cd my-app
npm start
# Opens http://localhost:3000
```

### Intelligent Defaults
- TypeScript by default (can opt out)
- 95% test coverage setup
- Performance budgets configured
- Security headers included
- PWA-ready structure

### Progressive Enhancement
```javascript
// Start simple
import { Component } from '@brutal/components';

// Add features as needed
import { createState } from '@brutal/state';
import { Router } from '@brutal/routing';
import { Form } from '@brutal/forms';
```

## Evolution

### V3 Approach
- Single giant bundle
- Complex configuration
- No tree shaking

### V4 Approach  
- Better but incomplete
- Missing tooling
- Manual setup

### V5 Approach
- Three clear paths
- Smart defaults
- Progressive adoption
- Migration tooling

## Trade-offs

✅ **Benefits**:
- Multiple entry points
- Clear upgrade paths
- Fast initial experience
- Flexible adoption

⚠️ **Considerations**:
- Multiple artifacts to maintain
- CDN users miss tree-shaking
- CLI requires maintenance
- Version synchronization

## Implementation Requirements

### CLI Tool
```javascript
// create-brutal-app/index.js
#!/usr/bin/env node
import { create } from '@brutal/cli';

create({
  templates: {
    spa: '@brutal/template-spa',
    mpa: '@brutal/template-mpa',
    pwa: '@brutal/template-pwa'
  },
  bundles: {
    lite: ['foundation', 'components'],
    core: ['foundation', 'components', 'state', 'routing'],
    // ... etc
  }
});
```

### CDN Build Pipeline
```javascript
// rollup.config.js
export default [
  // Browser builds
  buildConfig('brutal-lite', bundles.lite, 'iife'),
  buildConfig('brutal-core', bundles.core, 'iife'),
  
  // ES Module builds
  buildConfig('brutal-lite', bundles.lite, 'esm'),
  buildConfig('brutal-core', bundles.core, 'esm'),
];
```

## Success Metrics
- Time to first component: < 2 minutes
- Setup satisfaction: > 90%
- Migration success rate: > 95%
- CDN load time: < 100ms

## References
- Bundle Composition Pattern
- Package Structure Pattern
- V3/V4 Migration Guides

---

*Three ways to start, one way to succeed.*