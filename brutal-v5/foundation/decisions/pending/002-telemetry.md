# Decision: Telemetry Implementation

**Status**: Pending  
**Date**: 2024-07-12

## Context

Many applications need analytics and telemetry for understanding usage patterns. We need to decide if and how BRUTAL V5 should support this.

## Options

### Option A: Include in `@brutal/foundation/telemetry.ts`
- **Pros**: 
  - Built-in analytics support
  - Standardized approach
- **Cons**: 
  - Privacy concerns (opt-out vs opt-in)
  - Increases core size
  - Philosophical conflict with minimal core

### Option B: Create `@brutal/analytics` package
- **Pros**: 
  - Opt-in (privacy by default)
  - Keeps core focused
  - Can support multiple providers
- **Cons**: 
  - Another package to maintain

### Option C: Community plugin only
- **Pros**: 
  - Not our maintenance burden
  - Maximum flexibility
- **Cons**: 
  - No official solution
  - Potential fragmentation

## Recommendation

**Option B** - Create optional `@brutal/analytics` package

This respects user privacy by default while providing an official solution.

## Decision

**Pending your input**

## Consequences

Once decided:
- Define analytics interfaces
- Consider plugin architecture
- Document privacy stance