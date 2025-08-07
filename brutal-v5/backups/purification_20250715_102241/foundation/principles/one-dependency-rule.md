# 1️⃣ One Dependency Rule

> **Core Principle**: Enhanced packages must depend on ONLY their base package, importing exclusively from its public API.

## Why This Matters

### The Problem with Multiple Dependencies
```typescript
// ❌ WRONG: Enhanced package with multiple dependencies
// packages/@brutal/enhanced-components/package.json
{
  "dependencies": {
    "@brutal/components": "workspace:*",
    "@brutal/events": "workspace:*",     // Extra dependency!
    "@brutal/shared": "workspace:*"      // Extra dependency!
  }
}

// This creates hidden coupling and breaks modularity
import { EventEmitter } from '@brutal/events';  // NO!
import { dom } from '@brutal/shared';           // NO!
```

### The Power of Single Dependency
```typescript
// ✅ CORRECT: Enhanced package with one dependency
// packages/@brutal/enhanced-components/package.json
{
  "dependencies": {
    "@brutal/components": "workspace:*"  // ONLY the base package
  }
}

// Import ONLY from the base package's public API
import { Component, utils } from '@brutal/components';  // YES!
```

## Benefits

### 1. **True Modularity**
- Clear dependency boundaries
- No hidden coupling
- Easy to understand what each package needs

### 2. **Predictable Bundle Sizes**
- Know exactly what you're importing
- No surprise transitive dependencies
- Better tree-shaking

### 3. **Easier Testing**
- Only need to mock one dependency
- Clear contract between packages
- Isolated test environments

### 4. **Version Management**
- Upgrade base and enhanced together
- No version conflicts between shared deps
- Simpler dependency resolution

## Implementation Guidelines

### For Enhanced Packages

1. **Package.json Rule**
   ```json
   {
     "name": "@brutal/enhanced-[feature]",
     "dependencies": {
       "@brutal/[feature]": "workspace:*"
       // NO other @brutal/* dependencies!
     }
   }
   ```

2. **Import Rule**
   ```typescript
   // ✅ CORRECT: Import from base package
   import { 
     BaseComponent, 
     ComponentUtils,
     ComponentTypes 
   } from '@brutal/components';
   
   // ❌ WRONG: Import from other packages
   import { EventEmitter } from '@brutal/events';
   import { dom } from '@brutal/shared';
   ```

3. **Re-export Pattern**
   ```typescript
   // If base package needs to expose utilities
   // packages/@brutal/components/src/index.ts
   export { Component } from './component';
   export { dom } from '@brutal/shared';  // Re-export for enhanced
   export type { ComponentEvents } from '@brutal/events';
   ```

### For Base Packages

1. **Provide Complete API**
   ```typescript
   // packages/@brutal/state/src/index.ts
   // Export everything enhanced packages might need
   export { State } from './state';
   export { createStore } from './store';
   export { computed } from './computed';
   
   // Re-export needed utilities
   export type { EventEmitter } from '@brutal/events';
   export { debounce } from '@brutal/shared';
   ```

2. **Document Public API**
   ```typescript
   // Clearly mark what's public
   export {
     // Core functionality
     State,
     createStore,
     
     // Utilities for enhanced packages
     StateUtils,
     StateTypes,
     
     // Re-exports for enhanced packages
     EventEmitter as StateEventEmitter
   };
   ```

## Anti-Patterns to Avoid

### ❌ Direct Internal Imports
```typescript
// enhanced-components/src/async/AsyncComponent.ts
import { EventEmitter } from '@brutal/events';  // WRONG!
import { debounce } from '@brutal/shared/src/utils';  // WRONG!
```

### ❌ Circular Dependencies
```typescript
// @brutal/enhanced-state depends on @brutal/state
// @brutal/state depends on @brutal/enhanced-state  // WRONG!
```

### ❌ Peer Dependencies for Core Packages
```json
{
  "peerDependencies": {
    "@brutal/events": "*"  // Enhanced shouldn't have peers
  }
}
```

## Validation Strategy

### Automated Checks

1. **Dependency Validator Script**
   ```typescript
   // scripts/validate-dependencies.ts
   const enhancedPackages = [
     'enhanced-components',
     'enhanced-state',
     'enhanced-routing'
   ];
   
   for (const pkg of enhancedPackages) {
     const packageJson = require(`../packages/@brutal/${pkg}/package.json`);
     const deps = Object.keys(packageJson.dependencies || {});
     const brutalDeps = deps.filter(d => d.startsWith('@brutal/'));
     
     if (brutalDeps.length !== 1) {
       throw new Error(`${pkg} must have exactly 1 @brutal dependency`);
     }
   }
   ```

2. **Import Checker**
   ```bash
   # Check for invalid imports
   grep -r "@brutal/" packages/@brutal/enhanced-* \
     --include="*.ts" \
     --include="*.tsx" | \
     grep -v "from '@brutal/[base-package]"
   ```

3. **CI Pipeline Check**
   ```yaml
   - name: Validate One Dependency Rule
     run: |
       pnpm validate:dependencies
       pnpm check:imports
   ```

## Migration Guide

### From Multiple to Single Dependency

**Step 1: Identify Extra Dependencies**
```bash
cd packages/@brutal/enhanced-components
grep -r "from '@brutal/" src/ | grep -v "@brutal/components"
```

**Step 2: Update Base Package API**
```typescript
// packages/@brutal/components/src/index.ts
// Add missing exports that enhanced needs
export { EventEmitter } from '@brutal/events';
export { dom, utils } from '@brutal/shared';
```

**Step 3: Update Enhanced Package Imports**
```typescript
// Before
import { Component } from '@brutal/components';
import { EventEmitter } from '@brutal/events';
import { dom } from '@brutal/shared';

// After
import { 
  Component, 
  EventEmitter,  // Now from components
  dom            // Now from components
} from '@brutal/components';
```

**Step 4: Update package.json**
```json
{
  "dependencies": {
    "@brutal/components": "workspace:*"
    // Remove @brutal/events and @brutal/shared
  }
}
```

## Real-World Example

### Enhanced State Package
```typescript
// packages/@brutal/state/src/index.ts
// Base package provides complete API
export { State, createStore } from './core';
export { computed } from './computed';
export { middleware } from './middleware';

// Re-export for enhanced packages
export type { 
  StateEvents,
  StateOptions 
} from '@brutal/events';

// packages/@brutal/enhanced-state/src/time-travel.ts
// Enhanced only imports from base
import { 
  State, 
  createStore,
  StateEvents  // Gets events through state package
} from '@brutal/state';

// NOT: import { EventEmitter } from '@brutal/events';
```

## Exceptions

### Core Package Dependencies
Core packages CAN have multiple dependencies:
- `@brutal/components` → foundation, templates, events ✓
- `@brutal/state` → shared, events ✓
- `@brutal/routing` → events, shared ✓

### Build-time Dependencies
Dev dependencies don't count:
```json
{
  "devDependencies": {
    "@brutal/test-utils": "workspace:*",  // OK
    "@brutal/types": "workspace:*"         // OK
  }
}
```

## Validation Checklist

- [ ] Each enhanced package has exactly 1 @brutal dependency
- [ ] No direct imports from @brutal/shared in enhanced packages
- [ ] No direct imports from @brutal/events in enhanced packages  
- [ ] Base packages re-export needed utilities
- [ ] CI validates the one dependency rule
- [ ] Documentation shows correct import patterns

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md#enhanced-packages-20kb-total)
- [Dependency Graph](../architecture/DEPENDENCY-GRAPH.md)
- [Package Structure](./feature-based-structure.md)

---

*The one dependency rule ensures enhanced packages remain truly modular and maintainable as we scale to 42 packages.*