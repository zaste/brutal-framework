# Test Colocation Pattern

## Problem
Separating tests from source code creates maintenance overhead, poor discoverability, and tests that drift out of sync with implementation.

## Solution
Co-locate test files directly next to source files, using build-time extraction to ensure zero production overhead.

### File Organization
```
packages/state/src/
├── index.ts
├── index.test.ts       # Test next to source
├── proxy.ts
├── proxy.test.ts       # Test next to implementation
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts # Tests at every level
```

### Build-time Extraction
```javascript
// Test extractor plugin
export function testExtractor() {
  return {
    name: 'test-extractor',
    resolveId(id) {
      // Strip test files in production
      if (id.includes('.test.')) return false;
      if (id.includes('__tests__')) return false;
    }
  };
}
```

### Benefits
- **Discoverability**: Tests immediately visible
- **Maintenance**: Move/rename together
- **Coverage**: Obvious gaps
- **IDE Support**: Better navigation

### Testing Conventions
```typescript
// component.ts
export class Component { }

// component.test.ts
import { Component } from './component';

describe('Component', () => {
  it('should initialize', () => {
    const comp = new Component();
    expect(comp).toBeDefined();
  });
});
```

## Evolution
- V3: Tests mixed with prod code, no extraction
- V4: Separate test directories, poor DX
- V5: Co-location with extraction

## Trade-offs
- ✅ Better developer experience
- ✅ Tests stay in sync
- ✅ Zero production overhead
- ✅ Encourages test writing
- ❌ More files in src directories
- ❌ Different from common practice

## Related
- [Integrated Testing](./integrated-testing.md)
- [Coverage Requirements](../quality/coverage-requirements.md)
- [Build Optimization](../build/bundle-optimization.md)