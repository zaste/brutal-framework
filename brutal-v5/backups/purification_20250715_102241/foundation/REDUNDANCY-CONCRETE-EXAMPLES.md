# 🔴 Concrete Examples of Redundancy in @brutal

## 1. Templates Package - WORST OFFENDER (6 Implementations!)

```
@brutal/templates/src/
├── ultra-minimal.ts     # Exports: compile, render
├── minimal.ts           # Exports: compile, render  
├── compiler/
│   └── compiler.ts      # Class Compiler
├── core/
│   ├── compiler.ts      # Another Compiler!
│   ├── evaluator.ts     # Expression evaluator
│   ├── optimizer.ts     # CompactCompiler class
│   └── parser.ts        # Parser implementation
├── engine/
│   └── engine.ts        # Yet another compile/render
└── template/
    └── template.ts      # Template class

**SIX different ways to compile templates in ONE package!**
```

### What index.ts exports:
```typescript
// Only uses ultra-minimal.ts, ignoring ALL other implementations!
export { compile, TemplateError } from './ultra-minimal.js';
```

### Wasted Code:
- `compiler/compiler.ts` - NOT USED
- `core/*.ts` - NOT USED (5 files!)
- `engine/engine.ts` - NOT USED
- `minimal.ts` - NOT USED
- `template/template.ts` - NOT USED

## 2. Components Package - 3 Base Classes

### Current Structure:
```typescript
// 1. BrutalComponent - Abstract minimal
export abstract class BrutalComponent extends HTMLElement {
  protected abstract init(): void;
  protected abstract render(): void;
}

// 2. Component - Full featured (NOT EXPORTED!)
export class Component extends HTMLElement {
  // 300+ lines of lifecycle, state, props...
}

// 3. C - Ultra minimal (EXPORTED AS Component!)
export class C extends HTMLElement {
  // 223 lines, different API than Component
}
```

### Confusing exports:
```typescript
// index.ts exports C as Component!
export { C as Component } from './minimal.js';
export { BrutalComponent } from './base/BrutalComponent.js';
// Real Component class is NOT exported!
```

## 3. State Package - 3 createStore Functions

```
@brutal/state/src/
├── store/
│   ├── store.ts      # export function createStore()
│   └── core.ts       # ALSO export function createStore()!
├── minimal.ts        # export const s = () => // minimal store
└── index.ts          # Exports from store.ts AND minimal.ts!
```

### Different APIs, same name:
```typescript
// store/store.ts
export function createStore<T>(initial: T, options?: StoreOptions)

// store/core.ts  
export function createStore<T>(initialState: T): Store<T>

// minimal.ts (exported as 's')
export const s = <T>(i: T) => // Different API!
```

## 4. Routing Package - Multiple Routers

```
@brutal/routing/src/
├── router.ts         # class BrutalRouter + createRouter()
├── router/
│   └── router.ts     # ANOTHER class Router!
├── minimal.ts        # Minimal router (r function)
└── index.ts          # Exports minimal as main!
```

### Three different router implementations:
1. `BrutalRouter` class - Full featured
2. `Router` class - Different implementation
3. `r()` function - Minimal version (what gets exported)

## 5. Mixed Import/Export Confusion

### Components index.ts:
```typescript
// Renames everything!
export { 
  C as Component,      // C becomes Component
  comp as component,   // comp becomes component
  Btn as Button,       // Btn becomes Button
  Inp as Input,        // Inp becomes Input
  Mod as Modal         // Mod becomes Modal
} from './minimal.js';

// But also exports old pattern
export { BrutalComponent } from './base/BrutalComponent.js';
```

### Templates index.ts:
```typescript
// Uses ultra-minimal (ignoring minimal.ts!)
export { compile, TemplateError } from './ultra-minimal.js';
// All other implementations ignored
```

## 6. Size Impact

### Templates Package Files:
- `ultra-minimal.ts`: 359 lines (USED)
- `minimal.ts`: 422 lines (NOT USED)
- `compiler/compiler.ts`: 200+ lines (NOT USED)
- `core/*.ts`: 500+ lines total (NOT USED)
- `engine/engine.ts`: 150+ lines (NOT USED)

**Over 1,200 lines of unused code in templates alone!**

## 7. Developer Confusion Examples

### Which Component to extend?
```typescript
// Option 1 - What docs might say
class MyComponent extends Component { } // But Component isn't exported!

// Option 2 - What's actually exported
class MyComponent extends Component { } // This is actually C!

// Option 3 - Legacy pattern
class MyComponent extends BrutalComponent { } // Abstract class

// Which is correct? 🤷
```

### Which template compiler?
```typescript
// From index.ts
import { compile } from '@brutal/templates'; // ultra-minimal

// But also exists:
import { compile } from '@brutal/templates/minimal'; // different API
import { Compiler } from '@brutal/templates/compiler'; // class-based
import { TemplateEngine } from '@brutal/templates/engine'; // another way
```

## 8. Maintenance Nightmare

When fixing a bug in templates, which file to update?
- `ultra-minimal.ts`? (currently used)
- `minimal.ts`? (exists but unused)
- `compiler/compiler.ts`? (more features but unused)
- `core/compiler.ts`? (another implementation)
- `engine/engine.ts`? (yet another)

**Answer: Nobody knows without checking index.ts!**

## Summary

This is causing:
1. **Confusion**: Which implementation is the "real" one?
2. **Bloat**: Shipping unused code
3. **Maintenance**: Bugs might be fixed in wrong file
4. **Inconsistency**: Different packages use different patterns
5. **Documentation**: What to document? All versions?

## Recommendation

**Delete all unused implementations NOW:**
1. Templates: Keep only ultra-minimal.ts
2. Components: Pick ONE base class pattern
3. State: One createStore implementation
4. Router: One router pattern
5. Clear exports without renaming confusion