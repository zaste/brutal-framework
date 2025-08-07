# 🎯 Consolidation Plan: Full as Main, Minimal as Optional

## The Strategy: Best of Both Worlds

### Core Principle: 
- **Main export** = Full implementation (readable, debuggable, complete)
- **`/minimal` export** = Ultra-optimized version (when size matters)
- **Delete everything else** = No redundancy

## 📦 New Package Structure

```
@brutal/[package]/
├── src/
│   ├── index.ts         # Full implementation (default)
│   ├── minimal.ts       # Size-optimized version
│   └── types.ts         # Shared types
├── package.json         # Clear exports
└── README.md
```

### Package.json Exports:
```json
{
  "exports": {
    ".": "./dist/index.js",           // Full (default)
    "./minimal": "./dist/minimal.js"  // Opt-in minimal
  }
}
```

### Usage Pattern:
```javascript
// Default: Full implementation (better DX)
import { createStore } from '@brutal/state';

// Opt-in: Minimal for production builds
import { createStore } from '@brutal/state/minimal';
```

## 🔄 Consolidation Process (Per Package)

### Step 1: Analyze All Implementations
Identify the best features from each version:

#### Example - Templates Package:
```
Current files:
- ultra-minimal.ts   → Best: Size optimization techniques
- minimal.ts         → Best: Filter support
- compiler/          → Best: Error messages
- core/             → Best: AST optimization
- engine/           → Best: Caching strategy

Consolidate into:
- index.ts          → Full with all best features
- minimal.ts        → Ultra-compact keeping core functionality
```

### Step 2: Create Full Implementation
Combine best features without losing functionality:

```typescript
// src/index.ts - Full implementation
export function compile(template: string, options?: CompileOptions) {
  // Good error messages from compiler/
  if (!template) throw new TemplateError('Template is required');
  
  // AST optimization from core/
  const ast = parse(template);
  const optimized = optimize(ast);
  
  // Caching from engine/
  if (cache.has(template)) return cache.get(template);
  
  // Compilation logic
  const fn = generate(optimized);
  cache.set(template, fn);
  
  return fn;
}
```

### Step 3: Create Minimal Implementation
Keep only essential features for size:

```typescript
// src/minimal.ts - Size-optimized
export const c = (t: string) => {
  // No error checking, no caching, just core logic
  return new Function('d', `with(d){return\`${
    t.replace(/\${([^}]+)}/g, '${$1}')
  }\`}`);
};
```

### Step 4: Delete Everything Else
```bash
# After consolidation, delete:
rm -rf src/compiler/
rm -rf src/core/
rm -rf src/engine/
rm -rf src/base/
rm src/ultra-minimal.ts  # Merged into minimal.ts
```

## 📋 Package-by-Package Plan

### 1. Templates
- **Keep best of**: Error handling, caching, filters, expressions
- **Full**: Complete template engine with all features
- **Minimal**: Basic template compilation only
- **Delete**: compiler/, core/, engine/, ultra-minimal.ts

### 2. Components  
- **Keep best of**: Lifecycle, state management, event handling
- **Full**: Class-based with full TypeScript support
- **Minimal**: Compact functional components
- **Delete**: BrutalComponent.ts, duplicate UI components

### 3. State
- **Keep best of**: Reactivity, computed, middleware, devtools
- **Full**: createStore with all features
- **Minimal**: Basic reactive store
- **Delete**: store/core.ts, redundant files

### 4. Routing
- **Keep best of**: Guards, lazy loading, query parsing
- **Full**: Full router with all features
- **Minimal**: Basic navigation only
- **Delete**: router/router.ts, duplicate implementations

## 🎨 API Consistency

### Full Version (Readable):
```typescript
// Clear, self-documenting names
export function createComponent(config: ComponentConfig) {
  return class extends HTMLElement {
    state = config.state;
    render() { /* ... */ }
  };
}
```

### Minimal Version (Compact):
```typescript
// Ultra-compact but same API
export const c = (o) => {
  return class extends HTMLElement {
    s = o.s;
    r() { /* ... */ }
  };
}
```

## ✅ Benefits of This Approach

1. **No Loss**: All features preserved in full version
2. **Choice**: Developers choose readability vs size
3. **Clear Intent**: Default is developer-friendly
4. **Optimization**: Minimal available when needed
5. **Single Source**: Each feature has ONE implementation

## 🚀 Migration Strategy

### Phase 1: Consolidate
1. Merge all good features into main implementation
2. Create minimal version with core features only
3. Ensure API compatibility

### Phase 2: Update Exports
```typescript
// Old confusing exports
export { C as Component } from './minimal.js';

// New clear exports
export { Component } from './index.js';
```

### Phase 3: Delete Redundancy
- Remove all duplicate implementations
- Clean up legacy code
- Remove backward compatibility cruft

### Phase 4: Document
- Clear README showing when to use full vs minimal
- Bundle size comparisons
- Migration guide for existing users

## 📊 Expected Results

### Before:
- 6 template implementations
- 3 component base classes  
- Multiple confusing exports
- ~4,000 lines of redundant code

### After:
- 1 full + 1 minimal per package
- Clear, predictable exports
- ~1,500 lines total
- No functionality loss

## 🎯 Key Principle

**"Destilando sin pérdida"** - Distill without loss:
- Full version has ALL features from ALL implementations
- Minimal version has CORE features for size
- Nothing valuable is lost, only redundancy removed