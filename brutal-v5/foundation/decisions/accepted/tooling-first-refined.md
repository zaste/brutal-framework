# Decision: Tooling First (Refined)

**Status**: Accepted  
**Date**: 2024-07-14
**Refines**: 00-tooling-first.md

## Original Principle

"Build measurement, validation, and automation tooling BEFORE implementing features."

## Refined Understanding

Build **UNIQUE** measurement, validation, and automation tooling before features. Use existing tools where appropriate.

## The Tooling Hierarchy

### Level 1: Critical Custom Tools (BUILD THESE)
Tools that are specific to BRUTAL's architecture and goals:

```typescript
// These provide unique value
- Version compatibility matrix (BRUTAL-specific)
- 6KB/package bundle tracking (our specific constraint)
- Cross-package impact analysis (our architecture)
- Migration generators (framework-specific)
```

### Level 2: Enhanced Standard Tools (CONFIGURE THESE)
Standard tools configured for our needs:

```typescript
// Jest configured for our structure
- Co-located tests
- ESM modules
- Our assertion patterns

// ESLint configured with our rules
- No-dependency checks
- Bundle size warnings
- Our code style
```

### Level 3: Commodity Tools (USE THESE)
Well-solved problems that don't need reinvention:

```typescript
// Just use them
- Test runners (Jest)
- Linters (ESLint)  
- Bundlers (Rollup)
- Type checkers (TypeScript)
- Package managers (pnpm)
```

## Decision Criteria

### Build Custom Tooling When:
1. **Unique to our architecture**: No existing tool understands our constraints
2. **Competitive advantage**: The tool IS part of our value proposition  
3. **Integration need**: Multiple tools must work together in BRUTAL-specific ways
4. **Learning opportunity**: Building it teaches us something critical

### Use Existing Tooling When:
1. **Solved problem**: The tool does exactly what we need
2. **Maintenance burden**: Building it would distract from core value
3. **Community standard**: Developers expect it
4. **No differentiation**: Our version wouldn't be meaningfully better

## Examples

### ✅ CORRECT: Custom Bundle Tracker
```typescript
// Specific to our 6KB/package constraint
export class BrutalBundleTracker {
  validatePackageSize(pkg: string) {
    // Our specific logic
  }
}
```

### ❌ INCORRECT: Custom Test Runner
```typescript
// Jest already does this perfectly
export class BrutalTestRunner {
  // 10,000 lines of reinvented wheel
}
```

## The Real Meaning of "Tooling First"

1. **Measure what matters** (even if using Jest to do it)
2. **Validate constantly** (even if using ESLint)
3. **Automate everything** (even if using GitHub Actions)
4. **Build tools for BRUTAL-specific needs**
5. **Use tools for generic needs**

## Migration from Pure Interpretation

From the test-extractor experience:
1. Keep test-extractor as a learning exercise
2. Use Jest for actual testing
3. Document this decision to prevent future confusion
4. Focus custom tooling on BRUTAL-specific needs

## Success Metrics

We're applying this correctly when:
- ✅ We build tools that couldn't exist without BRUTAL context
- ✅ We configure standard tools for our needs
- ✅ We don't waste time on solved problems
- ✅ Our custom tools provide clear value
- ❌ We're NOT building "Jest but worse"

## References

- Original principle led to test-extractor tangent
- Successful frameworks use hybrid approach
- Pragmatism enables progress