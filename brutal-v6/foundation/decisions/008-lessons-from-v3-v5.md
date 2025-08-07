# Decision: Lessons from V3-V5 Failures

**Date**: 2025-07-15
**Status**: Permanent Reference

## Context

Before V6, BRUTAL went through multiple iterations that failed in different ways:
- V3: 206KB bloat, 104 syntax errors
- V4: Over-engineered, never completed
- V5: 43,282 files, complete chaos

## Decision

V6 will learn from ALL previous failures and enforce opposite patterns.

## Lessons Extracted

### From V3 (The Monolith)
- **Problem**: No size restrictions → 206KB bundle
- **V6 Solution**: 2KB hard limit per package, enforced automatically
- **Problem**: No quality gates → 104 syntax errors
- **V6 Solution**: Pre-commit validation, no exceptions

### From V4 (The Over-Engineer)
- **Problem**: Perfect architecture paralysis
- **V6 Solution**: Ship working code daily
- **Problem**: Too many empty directories
- **V6 Solution**: Create structure only when needed

### From V5 (The Explosion)
- **Problem**: "Living foundation" = no decisions
- **V6 Solution**: Permanent, executable decisions
- **Problem**: 43,282 files without control
- **V6 Solution**: Foundation validates everything

## Anti-Patterns to Prevent

### 1. Feature Creep
```typescript
// V3-V5 mindset: "Let's add this cool feature"
// V6 mindset: "Did a user request this?"
if (!userRequested) {
  throw new Error('Feature not requested by users');
}
```

### 2. Flexibility Obsession
```typescript
// V3-V5: Multiple ways to do everything
// V6: One correct way
implementations.length === 1 || throw Error('Multiple implementations');
```

### 3. Size Ignorance
```typescript
// V3-V5: "We'll optimize later"
// V6: Every commit checks size
build.size > 2048 && throw Error('Size limit exceeded');
```

## Implementation Principles

1. **Fail Fast**: Violations detected immediately, not later
2. **No Overrides**: No flags to bypass validation
3. **Measure Everything**: Size, complexity, duplication
4. **Automate Enforcement**: Humans forget, scripts don't

## The Ultimate Test

V6 succeeds if it makes V7 unnecessary. The foundation should prevent any possibility of regression that would require a rewrite.

## Remember

> "V3 tried to do everything and failed at basics"
> "V4 tried to be perfect and shipped nothing"  
> "V5 tried to be flexible and became chaos"
> "V6 tries to be minimal and will succeed"

## Enforcement

This document is referenced by all validation rules. The patterns described here are encoded in the foundation rules, not just documented.