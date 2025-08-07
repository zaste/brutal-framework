# Decision: Examples ARE Tests

**Date**: 2025-07-15
**Status**: Proposed

## Context

Traditional testing approaches:
- Unit tests test implementation details
- Integration tests test imaginary scenarios  
- Examples show real usage but aren't tests
- Documentation gets out of sync

This leads to:
- Tests that pass but examples that break
- Tested features nobody uses
- Untested real-world usage

## Decision

**Examples are our primary tests**. If examples work, the framework works.

## Implementation

```
examples/
├── counter/
│   ├── index.html
│   ├── app.js         # This IS the test
│   └── test.js        # Validates it works
├── todo/
│   ├── index.html
│   ├── app.js         # Tests dom + state
│   └── test.js        # Validates todos work
└── dashboard/
    ├── index.html
    ├── app.js         # Tests everything
    └── test.js        # Validates complex case
```

### Example Structure

```typescript
// examples/counter/app.js
import { c, s, e } from '@brutal/core';

// This code IS the test - if it runs, core works
const Counter = c(
  s({ count: 0 }),
  e
)(document.querySelector('#app'));

Counter.on('click', () => {
  Counter.state.count++;
});

// Export for validation
export { Counter };
```

```typescript
// examples/counter/test.js
import { Counter } from './app.js';

// Minimal validation that example works
test('counter increments', () => {
  Counter.state.count = 0;
  Counter.element.click();
  expect(Counter.state.count).toBe(1);
});
```

## Benefits

1. **Tests real usage** - Not imaginary scenarios
2. **Always in sync** - Examples must work
3. **Better than docs** - Working code > descriptions
4. **User-driven** - Tests what users actually do
5. **No test infrastructure** - Examples are self-contained

## What About Edge Cases?

Pattern tests (in foundation) cover:
- Composition patterns
- State management patterns
- Event handling patterns

Examples cover:
- Real-world usage
- Integration between packages
- Performance characteristics

## Test Execution

```bash
# Run all examples as tests
npm test

# Internally:
# 1. Build each example
# 2. Run in headless browser
# 3. Execute test.js validations
# 4. Measure bundle size
```

## Success Criteria

- [ ] Each package has ≥1 example using it
- [ ] Examples cover 80% of API surface
- [ ] Examples build without errors
- [ ] Examples stay under size budgets
- [ ] Examples run in all target browsers

## What We DON'T Test

- Implementation details
- Private functions
- Imaginary use cases
- 100% code coverage

## Enforcement

CI runs all examples. If examples fail, build fails. No exceptions.