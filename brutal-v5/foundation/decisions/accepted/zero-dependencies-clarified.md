# Decision: Zero Runtime Dependencies (Clarified)

**Status**: Accepted  
**Date**: 2024-07-14
**Supersedes**: zero-dependencies.md

## Context

The original "zero dependencies" principle led to confusion about scope, causing attempts to recreate development tools unnecessarily.

## Clarified Decision

BRUTAL V5 has **zero RUNTIME dependencies**. Development dependencies are pragmatically allowed.

## Clear Boundaries

### ✅ Zero Dependencies Apply To:
- Production code (`dependencies` in package.json)
- Runtime execution
- User bundles
- Published packages

### ❌ Zero Dependencies DO NOT Apply To:
- Development tools (`devDependencies`)
- Build processes
- Testing infrastructure
- Documentation generation

## The Pragmatic Test

Before implementing a tool, ask:
1. **Will this code ship to users?** → Zero deps required
2. **Is this only for development?** → Use best tool available
3. **Does this add unique value?** → Build it
4. **Is this a solved problem?** → Use existing solution

## Examples

### ✅ CORRECT Application:
```json
{
  "dependencies": {},  // Zero runtime deps
  "devDependencies": {
    "jest": "^29.0.0",     // Development only
    "typescript": "^5.0.0", // Build tool
    "eslint": "^8.0.0"      // Linting
  }
}
```

### ❌ INCORRECT Application:
- Building our own TypeScript compiler
- Creating a Jest replacement without unique value
- Reimplementing ESLint

## Rationale

1. **Focus**: Energy should go toward framework innovation, not tool recreation
2. **Productivity**: Standard tools have years of refinement
3. **Adoption**: Developers expect familiar tooling
4. **Maintenance**: Every line of code has a cost

## The 80/20 Rule

- 80% of our value: Zero-dependency runtime
- 20% pragmatic choices: Development tooling

## References

- Original principle caused test-extractor tangent
- Jest already configured and working
- Lesson learned: Pragmatism over purism