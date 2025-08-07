# Decision: Size as a Feature

**Date**: 2025-07-15
**Status**: Permanent

## Context

V5 grew to 152KB because size was a "nice to have" rather than a hard constraint. Without enforcement, code naturally expands.

## Decision

Every package has a **hard limit of 2KB**. Size is not optimized after development - it's a constraint during development.

## Rationale

1. **Forces Simplicity**: Can't fit complexity in 2KB
2. **Better Performance**: Smaller = faster parse/execute
3. **Mobile First**: Every byte costs on mobile
4. **Focus**: Must choose essential features only

## Implementation

The `size.ts` rule enforces this:
- Measures dist/index.js
- Fails build if over 2KB
- Provides auto-fix suggestions

## Techniques for Staying Small

### 1. Single-Letter Variables
```typescript
// Before: 50 bytes
export const createElement = (tagName) => document.createElement(tagName);

// After: 28 bytes  
export const c = (t) => document.createElement(t);
```

### 2. Reuse Native APIs
```typescript
// Bad: Custom implementation
const addClass = (el, cls) => {
  const classes = el.className.split(' ');
  if (!classes.includes(cls)) {
    classes.push(cls);
    el.className = classes.join(' ');
  }
};

// Good: Use native API
const addClass = (el, cls) => el.classList.add(cls);
```

### 3. Avoid Abstractions
```typescript
// Bad: Abstraction layer
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, handler) {
    (this.events[event] ||= []).push(handler);
  }
  emit(event, data) {
    this.events[event]?.forEach(h => h(data));
  }
}

// Good: Use native EventTarget
const emitter = new EventTarget();
emitter.addEventListener('event', handler);
emitter.dispatchEvent(new CustomEvent('event', { detail: data }));
```

### 4. Share Code Through Composition
```typescript
// Instead of duplicating logic, compose shared behaviors
const withCache = (fn) => {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) cache.set(key, fn(key));
    return cache.get(key);
  };
};
```

## Size Budget Allocation

For a typical package:
- Core logic: 1.5KB
- Error handling: 0.2KB  
- Types/interfaces: 0KB (removed in build)
- Edge cases: 0.3KB

## Exceptions

- `@brutal/core` can be up to 3KB (must justify every byte)
- Build tools don't count against size

## Measurement

Size is measured on the minified (not gzipped) output. This ensures consistency across different compression algorithms.

## Enforcement

Automated via `rules/size.ts`. Cannot be overridden.