# Decision: Test Co-location

**Status**: Accepted  
**Date**: 2024-07-11

## Context

Traditional test organization separates tests from source code, leading to:
- Harder to find tests for specific code
- Tests get out of sync with source
- Overhead of maintaining parallel directory structures

## Decision

Co-locate tests with source code, using build-time extraction to remove them from production bundles.

## Implementation

```
packages/state/src/
├── index.ts
├── index.test.ts       # Test next to source
├── proxy.ts
└── proxy.test.ts       # Test next to implementation
```

Build process:
1. Tests included during development
2. Test files stripped during production build
3. Zero overhead in final bundle

## Benefits

- **Discoverability**: Tests right next to code
- **Maintenance**: Move/rename code and tests together  
- **Coverage**: Obvious what lacks tests
- **DX**: Better IDE integration

## Trade-offs

✅ **Pros**:
- Better developer experience
- Tests stay in sync
- Encourages testing
- Zero production overhead

⚠️ **Cons**:
- Need build tool to strip tests
- Source directories have more files
- Different from common practice

## Implementation Details

Test extractor plugin:
```javascript
// @brutal/build-tools/plugins/test-extractor
export function testExtractor() {
  return {
    name: 'test-extractor',
    resolveId(id) {
      if (id.includes('.test.')) return false;
    }
  };
}
```

## References

- Inspired by: Rust's module tests
- Community feedback strongly supported
- V4 tried separate tests - worse DX