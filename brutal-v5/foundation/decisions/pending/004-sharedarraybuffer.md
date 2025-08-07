# Decision: SharedArrayBuffer Support

**Status**: Pending  
**Date**: 2024-07-12

## Context

SharedArrayBuffer enables true shared memory between workers, offering significant performance benefits. However, it requires specific security headers and isn't supported in all environments.

## Options

### Option A: Include in `@brutal/state` with fallback
- **Pros**: 
  - Performance benefits available by default
  - Transparent fallback for unsupported environments
- **Cons**: 
  - Complexity in core state package
  - May not work in all hosting environments

### Option B: Create `@brutal/state-sab` enhanced package
- **Pros**: 
  - Core state remains simple
  - Opt-in for those who can use it
  - Clear separation of concerns
- **Cons**: 
  - Another package to maintain
  - Potential API duplication

### Option C: Make it a plugin
- **Pros**: 
  - Maximum flexibility
  - Not a core concern
- **Cons**: 
  - Harder to integrate deeply
  - Plugin API complexity

## Recommendation

**Option A** - Include in `@brutal/state` with automatic fallback

The performance benefits are significant enough to warrant inclusion, and a transparent fallback maintains compatibility.

## Decision

**Pending your input**

## Consequences

Once decided:
- Implement detection and fallback logic
- Document security header requirements
- Create examples showing performance benefits