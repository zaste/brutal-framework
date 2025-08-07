# Principle: Automation Over Discipline

## The Principle

Don't rely on human discipline for critical quality measures. Automate everything that matters.

## Why This Matters

Humans are fallible:
- We forget to run tests
- We skip steps when rushed  
- We make "exceptions" that become permanent
- We have different standards

Automation is consistent:
- Never forgets
- Never makes exceptions
- Same standard every time
- Documents the requirement

## How We Apply It

### Quality Gates
```yaml
# ❌ BAD: Relying on discipline
Please remember to:
- Run tests before committing
- Check bundle size
- Update documentation

# ✅ GOOD: Automated enforcement
on: [push]
jobs:
  quality:
    - run: npm test -- --coverage
    - run: npm run size-check
    - run: npm run docs-check
```

### Code Formatting
```javascript
// ❌ BAD: Style guide document
"Please use 2 spaces for indentation"

// ✅ GOOD: Prettier on pre-commit
{
  "husky": {
    "hooks": {
      "pre-commit": "prettier --write"
    }
  }
}
```

### Dependency Management
```javascript
// ❌ BAD: "Don't add dependencies"

// ✅ GOOD: Automated check
function checkDependencies(pkg) {
  const deps = Object.keys(pkg.dependencies || {});
  if (deps.length > 0) {
    throw new Error('No runtime dependencies allowed');
  }
}
```

### Performance Budgets
```javascript
// ❌ BAD: "Keep bundles small"

// ✅ GOOD: Build-time enforcement
if (bundleSize > MAX_SIZE) {
  console.error(`Bundle too large: ${bundleSize} > ${MAX_SIZE}`);
  process.exit(1);
}
```

## Examples in V5

1. **95% Coverage**: Not a goal, a gate
2. **Type Safety**: TypeScript strict mode enforced
3. **Bundle Sizes**: Build fails if exceeded
4. **Commit Messages**: Conventional commits enforced
5. **Code Quality**: ESLint with error on warnings

## The Test

Before creating any process, ask:
1. Can this be automated?
2. What happens when someone forgets?
3. How do we know it's being followed?

If automation isn't possible, reconsider if it's truly important.

## Common Objections

**"But automation takes time to set up"**
- One-time cost vs. ongoing discipline
- Automation pays off after 3rd use

**"But we need flexibility"**
- Flexibility in code, not quality
- Standards should be inflexible

**"But it blocks urgent fixes"**
- Urgent fixes need quality too
- Fast and correct > fast and broken

## Implementation Checklist

- [ ] Pre-commit hooks for formatting
- [ ] CI/CD for tests and coverage
- [ ] Automated dependency checking
- [ ] Bundle size validation
- [ ] Performance benchmarks
- [ ] Documentation generation
- [ ] Release automation

---

*If it's important enough to have a rule, it's important enough to automate.*