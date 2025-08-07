# Decision: Zero Runtime Dependencies

**Status**: Accepted  
**Date**: 2024-07-08

## Context

External dependencies are a source of:
- Security vulnerabilities
- Version conflicts  
- Bundle size bloat
- Breaking changes
- Supply chain attacks

## Decision

BRUTAL V5 has **zero runtime dependencies**. No exceptions.

## What This Means

- No external packages in production code
- Dev dependencies are allowed (build tools, test runners)
- Must implement needed functionality ourselves
- Quality over convenience

## Implementation Guidelines

1. Before adding any dependency, ask:
   - Can we implement this ourselves?
   - Is it worth the tradeoff?
   - Answer is always: implement it ourselves

2. Common utilities we implement:
   - Event emitters
   - Promise utilities
   - DOM helpers
   - Type checking

## Consequences

- More initial work
- Complete control over code
- No dependency vulnerabilities
- Predictable behavior
- Smaller bundle size

## Examples

Instead of:
```javascript
import debounce from 'lodash/debounce';
```

We write:
```javascript
export function debounce(fn, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

## References

- Core principle from V3/V4 experience
- Validated by security audits