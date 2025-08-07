# Decision: SSR Support Location

**Status**: Pending  
**Date**: 2024-07-12

## Context

Server-Side Rendering (SSR) is a common requirement for SEO and initial page load performance. We need to decide where this functionality should live in the BRUTAL V5 architecture.

## Options

### Option A: Include in `@brutal/foundation/ssr.ts`
- **Size Impact**: ~2KB added to core bundle
- **Pros**: 
  - Available by default
  - Integrated with core systems
- **Cons**: 
  - Increases core size for feature not everyone needs
  - Violates "pay for what you use" principle

### Option B: Create separate `@brutal/ssr` package
- **Size Impact**: 0KB to core (separate package)
- **Pros**: 
  - Keeps core minimal
  - Opt-in for those who need it
  - Can evolve independently
- **Cons**: 
  - Another package to maintain
  - Might need hooks in core

## Recommendation

**Option B** - Create separate `@brutal/ssr` package

This aligns with our modular architecture and zero-overhead principle.

## Decision

**Pending your input**

## Consequences

Once decided:
- Update ARCHITECTURE.md with package location
- Define interfaces between core and SSR
- Plan implementation priority