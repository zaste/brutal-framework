# Decision: Composition Over Inheritance

**Date**: 2025-07-15
**Status**: Permanent

## Context

V5 mixed composition and inheritance patterns, leading to:
- Confusion about which pattern to use
- Inconsistent APIs
- Larger bundle sizes
- Harder testing

## Decision

BRUTAL uses **composition exclusively**. No class inheritance except extending HTMLElement for Web Components.

## Rationale

1. **Flexibility**: Behaviors can be mixed and matched
2. **Testability**: Functions are easier to test than classes
3. **Size**: Functions tree-shake better than classes
4. **Clarity**: One way to extend functionality

## Implementation

The `composition.ts` rule enforces this:
- No `class X extends Y` (except HTMLElement)
- No React class components
- Violations block commits

## Examples

### ❌ Inheritance (Not Allowed)
```typescript
class BaseComponent {
  state = {};
  render() {}
}

class Button extends BaseComponent {
  click() {}
}
```

### ✅ Composition (Required)
```typescript
const withState = (initial) => (element) => {
  element.state = createState(initial);
  return element;
};

const withClickable = (element) => {
  element.onclick = () => {};
  return element;
};

const button = compose(
  withClickable,
  withState({})
)(document.createElement('button'));
```

## Patterns

See `patterns/composition.test.ts` for complete examples.

### The Compose Function
```typescript
const compose = (...fns) => x => 
  fns.reduceRight((v, f) => f(v), x);
```

### Element Enhancement
```typescript
const enhance = compose(
  withEvents,
  withState({}),
  withLifecycle
);

const element = enhance(document.createElement('div'));
```

## Migration Guide

Converting from inheritance to composition:

1. Extract each method as a separate function
2. Convert instance variables to closure variables
3. Return enhanced object instead of using `this`
4. Compose behaviors instead of extending

## Enforcement

Automated via `rules/composition.ts`. No exceptions.