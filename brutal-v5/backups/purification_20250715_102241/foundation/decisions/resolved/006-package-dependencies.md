# Decision: Package Dependencies

**Status**: Resolved
**Date**: 2024-01-12
**Deciders**: Architecture Team

## Context

V5 requires a clear dependency graph to maintain modularity and prevent circular dependencies.

## Decision

Strict dependency graph enforced:

```javascript
const DEPENDENCY_GRAPH = {
  foundation: [],           // No dependencies
  shared: [],              // No dependencies
  events: ['shared'],
  templates: ['shared'],
  components: ['foundation', 'templates', 'events'],
  state: ['shared', 'events'],
  routing: ['events', 'shared'],
  cache: ['shared'],
  scheduling: [],          // No dependencies
  a11y: [],               // No dependencies
  plugins: ['events', 'shared']
};
```

## Rationale

1. **No circular dependencies** - Graph is acyclic
2. **Clear layers** - Foundation/shared at base
3. **Minimal coupling** - Most packages have 0-2 deps
4. **Independent a11y** - Accessibility standalone

## Consequences

- ✅ Packages can be used independently
- ✅ Clear mental model for developers
- ✅ Easy to test in isolation
- ⚠️ Must enforce in CI/build tools