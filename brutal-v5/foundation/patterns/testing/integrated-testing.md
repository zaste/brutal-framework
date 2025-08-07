# Integrated Testing Pattern

## Problem
Traditional testing frameworks are separate from the application, creating overhead, maintenance burden, and deployment complexity.

## Solution
Testing as components - integrate testing directly into the framework as first-class components that can be extracted for production builds.

### Implementation
```javascript
// Test components are regular components
export class TestComponent extends Component {
  static testMode = true; // Stripped in production
  
  async runTests() {
    const results = await this.executeScenarios();
    this.renderResults(results);
  }
}

// Build process extracts test code
// rollup.config.js
{
  plugins: [
    stripTestCode({
      patterns: ['*.test.js', '**/__tests__/**'],
      properties: ['testMode', 'runTests']
    })
  ]
}
```

### Benefits
- Zero production overhead
- Visual testing capabilities
- Component self-testing
- Integrated development experience

## Evolution
- V3: Testing mixed with production code
- brutal-test: Separate testing framework
- V5: Testing as extractable components

## Trade-offs
- ✅ No separate test framework needed
- ✅ Visual testing built-in
- ✅ Zero production impact
- ❌ Need extraction tooling
- ❌ Test isolation complexity

## Related
- [Coverage Requirements](../quality/coverage-requirements.md)
- [Component Lifecycle](../core/component-lifecycle.md)
- [Bundle Composition](../architecture/bundle-composition.md)