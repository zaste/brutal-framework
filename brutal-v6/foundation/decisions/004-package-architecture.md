# Decision: Package Architecture

**Date**: 2025-07-15
**Status**: Proposed

## Context

After V5's failure with 152KB across 19 packages, we need a clean, minimal package architecture that enforces our principles.

## Decision

BRUTAL V6 will have exactly 7 packages with strict size limits and dependency rules.

## Package Structure

```
@brutal/core      (2KB)  - Composition utilities
@brutal/dom       (2KB)  - DOM manipulation & templates
@brutal/state     (1KB)  - Reactive state management
@brutal/events    (1KB)  - Event handling system
@brutal/router    (1KB)  - SPA routing
@brutal/animation (1KB)  - GPU-accelerated animations
@brutal/utils     (0.5KB) - Shared utilities
─────────────────────────
TOTAL:            8.5KB
```

## Dependency Rules

```
No external dependencies (enforced by foundation)

Internal dependencies:
- utils: no dependencies
- core: depends on utils only
- dom, state, events: depend on core + utils
- router, animation: depend on all above
```

## Why These Packages?

Each package represents one core concern:

1. **core**: How to compose behaviors (the foundation pattern)
2. **dom**: How to manipulate DOM efficiently
3. **state**: How to manage reactive data
4. **events**: How to handle events properly
5. **router**: How to navigate in SPAs
6. **animation**: How to animate smoothly
7. **utils**: Shared micro-utilities

## What We DON'T Have

No packages for:
- Components (use composition)
- Forms (use dom + state)
- HTTP (use fetch)
- Validation (user concern)
- UI library (user builds their own)

## Size Enforcement

Each package size is enforced by foundation:
- Build fails if over limit
- No exceptions granted
- Size measured on minified output

## API Design

Each package exports:
```typescript
// Verbose for development
export function createSomething() {}

// Minified for production  
export const c = createSomething;
```

Users choose their tradeoff.

## Success Metrics

- Total framework < 10KB
- Each package usable standalone
- No feature duplication
- Clear dependency hierarchy

## Enforcement

The foundation `size.ts` and `dependencies.ts` rules enforce this architecture automatically.