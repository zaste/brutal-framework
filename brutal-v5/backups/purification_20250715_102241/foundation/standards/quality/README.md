# 📊 BRUTAL V5 - Quality Standards

## Non-Negotiable Requirements

These standards are enforced automatically. No exceptions.

## 1. Code Coverage

### Minimum Requirements
- **Overall**: 95%
- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

### Per-Package Configuration
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
  }
};
```

### What Counts as Covered
- ✅ Unit tests
- ✅ Integration tests
- ✅ Type tests
- ❌ Example code
- ❌ Build scripts

## 2. Type Safety

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Coverage Requirements
- 100% of public APIs must have types
- 100% of internal functions must have types
- No `any` without documented reason
- Strict mode always enabled

## 3. Performance Budgets

### Package-Level Budgets
| Package | Max Size | Max Init Time | Max Memory |
|---------|----------|---------------|------------|
| foundation | 6KB | 10ms | 500KB |
| shared | 4KB | 5ms | 300KB |
| events | 5KB | 8ms | 400KB |
| templates | 7KB | 12ms | 600KB |
| components | 8KB | 15ms | 800KB |
| state | 6KB | 10ms | 500KB |
| routing | 6KB | 12ms | 600KB |
| cache | 5KB | 10ms | 500KB |
| scheduling | 3KB | 5ms | 300KB |
| a11y | 4KB | 8ms | 400KB |
| plugins | 4KB | 8ms | 400KB |

### Bundle-Level Budgets
| Bundle | Max Size | Max Init Time | Max FCP |
|--------|----------|---------------|---------|
| lite | 15KB | 30ms | 100ms |
| core | 35KB | 50ms | 150ms |
| enhanced | 50KB | 80ms | 200ms |
| ui | 80KB | 120ms | 250ms |
| full | 150KB | 200ms | 300ms |

### Performance Metrics
```javascript
// performance.test.js
test('initialization performance', async () => {
  const start = performance.now();
  await import('@brutal/foundation');
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(10); // 10ms budget
});
```

## 4. Code Quality

### Linting Rules
```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'complexity': ['error', 10],
    'max-depth': ['error', 3],
    'max-lines': ['error', 300],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 3],
    'no-console': 'error',
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error'
  }
};
```

### Code Complexity
- Cyclomatic complexity: Max 10
- Cognitive complexity: Max 15
- Nesting depth: Max 3
- File length: Max 300 lines
- Function length: Max 50 lines

## 5. Documentation

### Required Documentation
1. **README.md** - Package overview
2. **API.md** - Complete API reference
3. **EXAMPLES.md** - Usage examples
4. **CHANGELOG.md** - Version history

### JSDoc Requirements
```typescript
/**
 * Creates a reactive state object
 * @param initial - Initial state value
 * @returns Proxy-wrapped reactive state
 * @example
 * const state = createState({ count: 0 });
 * state.count++; // Triggers updates
 */
export function createState<T>(initial: T): T {
  // Implementation
}
```

### Documentation Coverage
- 100% of public APIs documented
- All parameters described
- All return values described
- At least one example per function

## 6. Testing Standards

### Test Structure
```
package/
├── src/
│   ├── index.ts
│   └── utils.ts
└── tests/
    ├── unit/
    │   ├── index.test.ts
    │   └── utils.test.ts
    ├── integration/
    │   └── scenarios.test.ts
    └── performance/
        └── benchmarks.test.ts
```

### Test Requirements
- Unit tests for all functions
- Integration tests for public APIs
- Performance tests for critical paths
- Type tests for TypeScript
- Visual tests for UI components

### Test Quality
```javascript
// ❌ Bad test
test('works', () => {
  expect(add(1, 2)).toBe(3);
});

// ✅ Good test
test('add() returns sum of two numbers', () => {
  expect(add(1, 2)).toBe(3);
  expect(add(-1, 1)).toBe(0);
  expect(add(0, 0)).toBe(0);
  expect(add(0.1, 0.2)).toBeCloseTo(0.3);
});
```

## 7. Accessibility

### WCAG 2.1 AA Compliance
- All interactive elements keyboard accessible
- ARIA attributes where needed
- Color contrast 4.5:1 minimum
- Focus indicators visible
- Screen reader tested

### Accessibility Tests
```javascript
test('button is accessible', () => {
  const button = document.querySelector('brutal-button');
  expect(button.getAttribute('role')).toBe('button');
  expect(button.tabIndex).toBe(0);
  expect(button.getAttribute('aria-label')).toBeTruthy();
});
```

## 8. Security

### Security Requirements
- No eval() or Function()
- No innerHTML without sanitization
- CSP compatible by default
- XSS protection built-in
- Input validation mandatory

### Security Scanning
- Dependency scanning (npm audit)
- Static analysis (ESLint security)
- Dynamic analysis (OWASP ZAP)
- Manual review for crypto

## 9. CI/CD Gates

### Quality Gates (Block Merge)
1. ❌ Coverage < 95%
2. ❌ Type errors
3. ❌ Lint errors
4. ❌ Test failures
5. ❌ Performance regression
6. ❌ Size budget exceeded
7. ❌ Security vulnerabilities
8. ❌ Accessibility failures

### Performance Gates
```yaml
- name: Performance Check
  run: |
    npm run bench
    if [ $(cat perf.json | jq '.duration') -gt 50 ]; then
      echo "Performance regression detected"
      exit 1
    fi
```

## 10. Release Standards

### Semantic Versioning
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist
- [ ] All tests passing
- [ ] Coverage > 95%
- [ ] No security vulnerabilities
- [ ] Performance benchmarks pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Migration guide (if needed)

## Enforcement

These standards are enforced through:
1. **Pre-commit hooks** - Husky + lint-staged
2. **CI/CD pipeline** - GitHub Actions
3. **Code review** - Required approvals
4. **Automated tools** - Danger.js
5. **Monitoring** - Performance tracking

---

*Quality is not negotiable. These standards ensure BRUTAL V5 remains brutal.*