# 📦 BRUTAL V5 - Bundle Composition Map

> ✅ **Distilled**: 2024-07-12  
> Full pattern extracted to **[Bundle Composition Pattern](../../patterns/architecture/bundle-composition.md)**

## Bundle Definitions

This document provides the exact bundle compositions. For strategy, custom bundles, and implementation details, see the pattern doc.

### brutal-lite.js (15KB)
Minimal bundle for landing pages and simple apps.

```javascript
export const BRUTAL_LITE = [
  '@brutal/foundation',     // 6KB - Registry, Config, Polyfills, Constants
  '@brutal/shared',         // 4KB - Core utilities + errors
  '@brutal/templates',      // 7KB - Template engine + cache
  '@brutal/components'      // 1KB - Base component only (tree-shaken)
];
```

### brutal-core.js (35KB)
Complete core framework for SPAs.

```javascript
export const BRUTAL_CORE = [
  ...BRUTAL_LITE,
  '@brutal/events',         // 4KB - Event system
  '@brutal/state',          // 5KB - State management
  '@brutal/routing',        // 6KB - SPA routing
  '@brutal/cache',          // 5KB - Cache layers
  '@brutal/scheduling',     // 3KB - DOM scheduler
  '@brutal/a11y',          // 3KB - Accessibility
  '@brutal/plugins'        // 4KB - Plugin system
];
```

### brutal-enhanced.js (55KB)
Core plus enhanced versions.

```javascript
export const BRUTAL_ENHANCED = [
  ...BRUTAL_CORE,
  '@brutal/enhanced-components',  // 12KB - Advanced components
  '@brutal/enhanced-state',       // 12KB - Time-travel, persist
  '@brutal/enhanced-routing'      // 10KB - Guards, transitions
];
```

### brutal-ui.js (80KB)
Enhanced plus UI components.

```javascript
export const BRUTAL_UI = [
  ...BRUTAL_ENHANCED,
  '@brutal/forms',              // 12KB - Form system
  '@brutal/ui-primitives',      // 20KB - UI library
  '@brutal/animation'           // 12KB - Animations
];
```

### brutal-full.js (150KB)
Everything. Kitchen sink included.

```javascript
export const BRUTAL_FULL = [
  ...BRUTAL_UI,
  '@brutal/performance',        // 10KB - Optimization
  '@brutal/gpu',                // 15KB - WebGL
  '@brutal/mobile',             // 8KB - Mobile
  '@brutal/workers',            // 10KB - Threading
  '@brutal/data',               // 15KB - Data handling
  '@brutal/pwa',                // 12KB - PWA features
  '@brutal/i18n',               // 8KB - i18n
  '@brutal/security',           // 6KB - Security
  '@brutal/debug',              // 10KB - Debug tools
  '@brutal/ai'                  // 8KB - AI features
];
```

## Custom Bundle Configuration

Users can define custom bundles in `brutal.config.js`:

```javascript
// brutal.config.js
export default {
  // Option 1: Extend existing bundle
  bundle: {
    extends: 'core',
    add: [
      '@brutal/forms',
      '@brutal/animation'
    ],
    remove: [
      '@brutal/cache'  // If not needed
    ]
  },
  
  // Option 2: Custom selection
  bundle: [
    '@brutal/foundation',
    '@brutal/components',
    '@brutal/state',
    '@brutal/forms'
  ],
  
  // Option 3: Multiple bundles
  bundles: {
    'app.js': ['@brutal/core', '@brutal/forms'],
    'landing.js': ['@brutal/lite'],
    'admin.js': ['@brutal/full']
  }
};
```

## Import Resolution

### From CDN
```html
<!-- Predefined bundles -->
<script src="https://unpkg.com/brutal/dist/brutal-core.js"></script>

<!-- Individual packages -->
<script type="module">
  import { Component } from 'https://unpkg.com/@brutal/components';
</script>
```

### From NPM
```javascript
// Full bundle
import * as Brutal from 'brutal';

// Individual packages
import { Component } from '@brutal/components';
import { createState } from '@brutal/state';

// Tree-shakeable
import { html } from '@brutal/templates/html';
```

## Size Budget Enforcement

Each bundle has strict size limits:

| Bundle | Max Size (gzip) | Max Size (raw) |
|--------|----------------|----------------|
| lite | 15KB | 45KB |
| core | 30KB | 90KB |
| enhanced | 50KB | 150KB |
| ui | 80KB | 240KB |
| full | 150KB | 450KB |

## Build Output Structure

```
dist/
├── bundles/
│   ├── brutal-lite.js         (15KB)
│   ├── brutal-lite.js.map
│   ├── brutal-core.js         (30KB)
│   ├── brutal-core.js.map
│   ├── brutal-enhanced.js     (50KB)
│   ├── brutal-enhanced.js.map
│   ├── brutal-ui.js           (80KB)
│   ├── brutal-ui.js.map
│   ├── brutal-full.js         (150KB)
│   └── brutal-full.js.map
│
├── packages/                   # Individual packages
│   ├── foundation/
│   │   ├── index.js
│   │   ├── index.d.ts
│   │   └── index.js.map
│   └── [... all packages]
│
└── custom/                     # User custom bundles
    └── [generated bundles]
```

## Version Matrix

| Bundle | Packages | Version Policy |
|--------|----------|----------------|
| lite | 4 packages | Lockstep versioning |
| core | 11 packages | Lockstep versioning |
| enhanced | 14 packages | Lockstep versioning |
| ui | 17 packages | Lockstep versioning |
| full | 30 packages | Lockstep versioning |

## Bundle Validation

Each bundle is validated for:
1. **Size**: Must not exceed budget
2. **Dependencies**: No circular dependencies
3. **Performance**: <50ms init time
4. **Compatibility**: Works in target browsers
5. **Tree-shaking**: Properly eliminates dead code

---

*This map is the source of truth for bundle composition. Any deviation requires architecture review.*