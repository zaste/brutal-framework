# Decision: Zero Runtime Dependencies

**Date**: 2025-07-15
**Status**: Permanent

## Context

Every external dependency is:
- Additional bytes in the bundle
- A potential security vulnerability
- A maintenance burden
- A breaking change risk

## Decision

BRUTAL will have **zero external runtime dependencies**. Only browser APIs are allowed.

## Rationale

1. **Size**: No dependency = no bytes
2. **Security**: No supply chain attacks
3. **Stability**: No surprise breaking changes
4. **Performance**: No parsing external code
5. **Simplicity**: No version conflicts

## Implementation

The `dependencies.ts` rule enforces this automatically:
- Runtime dependencies must be 0 or @brutal/* only
- DevDependencies have strict allowlist
- Violations block commits and CI

## Consequences

### Positive
- Tiny bundle size
- No npm install for users
- Works offline immediately
- No security advisories

### Negative
- Must implement everything ourselves
- No quick library solutions
- More initial development time

### Mitigations
- Copy well-tested patterns (with attribution)
- Focus on browser API usage
- Keep implementations minimal

## Examples

### ❌ Not Allowed
```json
{
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^18.0.0"
  }
}
```

### ✅ Allowed
```json
{
  "dependencies": {
    "@brutal/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

## Enforcement

Automated via `rules/dependencies.ts`. Cannot be overridden.