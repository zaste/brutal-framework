# Decision: Dual API Strategy

**Date**: 2025-07-15
**Status**: Proposed

## Context

We have competing needs:
- **Developer Experience**: Readable, self-documenting APIs
- **Size Constraint**: 2KB limit per package

Single-letter APIs are tiny but horrible DX. Verbose APIs are nice but too large.

## Decision

Export **both verbose and minified versions** of every API.

## Implementation

```typescript
// Every export follows this pattern:

// Verbose version (for development)
export function composeFunctions(...functions) {
  return (initialValue) => 
    functions.reduceRight((value, func) => func(value), initialValue);
}

// Minified alias (for production)
export const c = composeFunctions;
```

## Usage

Developers choose based on their needs:

```typescript
// Development (clear, debuggable)
import { composeFunctions, withState, withEvents } from '@brutal/core';

const enhance = composeFunctions(
  withState({ count: 0 }),
  withEvents
);
```

```typescript
// Production (minimal size)
import { c, s, e } from '@brutal/core';

const enhance = c(
  s({ count: 0 }),
  e
);
```

## Build Tool Integration

Optional transform for automatic optimization:

```typescript
// Babel plugin or similar
// Transforms: composeFunctions → c
// In production builds only
```

## Guidelines

1. **Verbose names must be clear**
   - `composeFunctions` not `compose`
   - `withState` not `state`
   - `createElement` not `create`

2. **Minified names must be consistent**
   - `c` = create/compose
   - `w` = with
   - `s` = state
   - `e` = events/element

3. **Document the mapping**
   ```typescript
   /**
    * @alias c
    */
   export function composeFunctions() {}
   ```

## Benefits

- **Development**: Full IntelliSense, readable code
- **Production**: Minimal size, meets constraints
- **Migration**: Easy to switch between modes
- **Learning**: Verbose helps understand, minified for prod

## Tradeoffs

- Slightly larger package (exports two names)
- Two ways to do same thing
- Need to maintain mapping

These tradeoffs are acceptable for the DX improvement.

## Example

```typescript
// @brutal/core exports
export function composeFunctions(...fns) { } // 46 chars
export const c = composeFunctions;            // +33 chars
// Total: 79 chars vs 46 chars (1.7x)

// But usage is different:
enhance = composeFunctions(withState, withEvents) // Dev: readable
enhance = c(s, e)                                 // Prod: tiny
```

## Enforcement

Pattern tests demonstrate both versions. Foundation validates total size stays under limit.