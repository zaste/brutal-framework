# Decision: Error Package Structure

**Status**: Pending  
**Date**: 2024-07-12

## Context

Error handling is fundamental to any framework. We need to decide whether errors should have their own package or remain in the shared utilities.

## Current Plan

Errors are in `@brutal/shared`:
```typescript
// shared/src/errors.ts
export class BrutalError extends Error { }
export class ValidationError extends BrutalError { }
export class NetworkError extends BrutalError { }
// ... more errors
```

## Options

### Option A: Keep in `@brutal/shared`
- **Pros**: 
  - Simpler structure
  - Errors are "shared" utilities
  - One less package
- **Cons**: 
  - Shared package might grow large
  - Less clear ownership

### Option B: Create `@brutal/errors` package
- **Pros**: 
  - Clear separation of concerns
  - Can include error handling utilities
  - Easier to extend
- **Cons**: 
  - Another small package
  - Might be overkill for ~1KB of code

## Recommendation

**Option A** - Keep in `@brutal/shared`

Errors are fundamental utilities that truly are "shared" across all packages.

## Decision

**Pending your input**

## Consequences

Once decided:
- Update package structure documentation
- Plan error hierarchy
- Define error handling patterns