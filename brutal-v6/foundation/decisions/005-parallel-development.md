# Decision: Parallel Development Approach

**Date**: 2025-07-15
**Status**: Proposed

## Context

V5 was built in isolation without user validation, resulting in imaginary features and 7 different template implementations. We need a development approach that prevents this.

## Decision

Use **Parallel Development**: Build framework and examples simultaneously in tight feedback loops.

## The Process

```
Morning:   Build small piece of package
Afternoon: Use it in real example
Evening:   Refine based on usage
Repeat:    For each feature
```

## Why Not Alternatives?

### Core-First (Bottom-Up)
```
❌ Build all packages → Then build examples
```
- This created V5's problems
- Imaginary requirements
- Over-engineering
- No user validation

### App-First (Top-Down)  
```
❌ Build complete app → Then extract packages
```
- Might miss patterns
- Lots of refactoring
- Inconsistent architecture

## Implementation

For each package:

1. **Minimal Implementation** (1-2 hours)
   ```typescript
   // Just enough to be useful
   export const compose = (...fns) => x => 
     fns.reduceRight((v, f) => f(v), x);
   ```

2. **Immediate Usage** (1-2 hours)
   ```typescript
   // Use in real example
   const Counter = compose(
     withState({ count: 0 }),
     withEvents
   )(element);
   ```

3. **Refinement** (1 hour)
   - Fix pain points discovered
   - Optimize size
   - Improve API

4. **Pattern Test** (30 min)
   - Document the pattern
   - Ensure it's reusable

## Benefits

- **No imaginary features** - Everything is used immediately
- **Fast feedback** - Problems found in hours, not months
- **User-driven** - Real usage drives design
- **Stay small** - Only add what examples need

## Example Schedule

**Day 1: Core + Counter**
- Morning: compose, withState, withEvents
- Afternoon: Counter example using core
- Evening: Refine based on counter needs

**Day 2: DOM + TODO**  
- Morning: Templates, rendering
- Afternoon: TODO app using dom + core
- Evening: Refine based on TODO needs

## Success Criteria

- Every line of framework code is used in an example
- Examples guide API design
- No unused features
- Continuous validation

## Enforcement

This is a process decision, not enforced by code. Team discipline required.