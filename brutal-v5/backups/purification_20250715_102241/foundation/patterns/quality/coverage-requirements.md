# Pattern: Coverage Requirements

## Problem
Without strict coverage requirements, code quality degrades over time:
- Untested code accumulates
- Bugs slip through
- Refactoring becomes risky
- Technical debt grows

## Solution
Enforce 95% minimum coverage across all metrics with automated gates.

## Implementation

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/examples/',
    '/__mocks__/'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}' // Re-exports don't need tests
  ]
};
```

### What Counts as Coverage
✅ **Included**:
- Unit tests
- Integration tests  
- Type tests
- Error path tests
- Edge case tests

❌ **Excluded**:
- Example code
- Build scripts
- Type definitions
- Mock files
- Test utilities

### Test Structure Requirements
```
package/
├── src/
│   ├── index.ts
│   └── utils.ts
└── tests/
    ├── unit/          # Isolated unit tests
    ├── integration/   # API integration tests
    └── performance/   # Performance benchmarks
```

### Quality Test Examples
```javascript
// ❌ Bad - Single case, no description
test('works', () => {
  expect(add(1, 2)).toBe(3);
});

// ✅ Good - Multiple cases, clear intent
describe('add()', () => {
  it('returns sum of positive numbers', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(10, 20)).toBe(30);
  });
  
  it('handles negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
    expect(add(-5, -5)).toBe(-10);
  });
  
  it('handles floating point precision', () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
  
  it('throws on non-numeric input', () => {
    expect(() => add('1', '2')).toThrow(TypeError);
  });
});
```

### Branch Coverage Patterns
```javascript
// Ensure all branches covered
function processValue(value, options = {}) {
  // Branch 1: null check
  if (value == null) {
    return options.default || '';
  }
  
  // Branch 2: type check
  if (typeof value === 'object') {
    // Branch 3: array check
    return Array.isArray(value) 
      ? value.join(',')
      : JSON.stringify(value);
  }
  
  // Branch 4: default
  return String(value);
}

// Tests must cover ALL branches
test('processValue covers all branches', () => {
  // Branch 1
  expect(processValue(null)).toBe('');
  expect(processValue(undefined, { default: 'N/A' })).toBe('N/A');
  
  // Branch 2 + 3 (array)
  expect(processValue([1, 2, 3])).toBe('1,2,3');
  
  // Branch 2 + 3 (object)
  expect(processValue({ a: 1 })).toBe('{"a":1}');
  
  // Branch 4
  expect(processValue('text')).toBe('text');
  expect(processValue(123)).toBe('123');
});
```

## Enforcement

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:coverage"
    }
  }
}
```

### CI Pipeline
```yaml
- name: Test Coverage
  run: |
    npm run test:coverage
    # Fails if coverage < 95%
```

### Coverage Reporting
```javascript
// Generate detailed reports
{
  "coverageReporters": [
    "text",
    "lcov",
    "html",
    "json-summary"
  ]
}
```

## Best Practices

### 1. Test Behavior, Not Implementation
```javascript
// ❌ Bad - Testing internals
test('sets internal flag', () => {
  const obj = createObject();
  expect(obj._internalFlag).toBe(true);
});

// ✅ Good - Testing behavior
test('validates input on creation', () => {
  expect(() => createObject(null)).toThrow('Invalid input');
});
```

### 2. Use Test Builders
```javascript
// Reduce boilerplate with builders
function buildComponent(overrides = {}) {
  return {
    props: { theme: 'dark', size: 'md' },
    state: { isOpen: false },
    ...overrides
  };
}

test('component with custom props', () => {
  const component = buildComponent({
    props: { theme: 'light' }
  });
  expect(component.props.theme).toBe('light');
});
```

### 3. Test Error Paths
```javascript
test('handles errors gracefully', async () => {
  const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
  const result = await fetchData('url', { fetch: mockFetch });
  
  expect(result).toEqual({ error: 'Network error' });
  expect(mockFetch).toHaveBeenCalledWith('url');
});
```

## Evolution

### V3 Approach
- 80% target
- Manual enforcement
- Incomplete metrics

### V4 Approach
- 90% target
- Some automation
- Better but not strict

### V5 Approach
- 95% requirement
- Fully automated
- No exceptions
- All metrics tracked

## Trade-offs

✅ **Benefits**:
- High confidence in changes
- Safe refactoring
- Fewer production bugs
- Self-documenting code

⚠️ **Costs**:
- Initial setup time
- Test maintenance
- Slower initial development
- Can encourage gaming metrics

## References
- Jest documentation
- Istanbul coverage tool
- V5 Quality Standards

---

*95% coverage: Because 94% is not brutal enough.*