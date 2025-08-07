# 📋 Decision: Foundation Architecture

**Date**: 2025-07-15
**Status**: Exploring
**Decision By**: [Pending]

## 🎯 Objective
Design a foundation that prevents regression to V5's 152KB bloat while enabling rapid, confident development.

## 📊 Options Summary

### Option A: TypeScript-First Foundation
```
foundation/
├── constraints/        # TS executable constraints
├── patterns/          # TS pattern implementations  
├── boundaries/        # TS-validated boundaries
└── tests/            # Jest tests for everything
```

**Estimated Complexity**: Medium
**Maintenance Burden**: Medium-High
**Enforcement Power**: Very High

### Option B: Configuration-First Foundation
```
foundation/
├── rules/            # YAML/JSON rules
├── patterns/         # Markdown + code snippets
├── boundaries/       # YAML boundaries
└── validator/        # Single TS validator
```

**Estimated Complexity**: Low initially, High later
**Maintenance Burden**: Low-Medium  
**Enforcement Power**: Medium

### Option C: Hybrid Foundation
```
foundation/
├── core/             # TS immutable core (~5 files)
│   ├── constraints.ts
│   ├── validator.ts
│   └── types.ts
├── rules/            # YAML configurable rules
├── patterns/         # MD docs + TS examples
└── tests/           # Tests for core only
```

**Estimated Complexity**: Low
**Maintenance Burden**: Low
**Enforcement Power**: High

## 🔍 Critical Insights

### From V5 Failure Analysis:
1. **Complexity grows in code** - V5's TS grew from simple to complex
2. **Documentation disconnects** - Docs said one thing, code did another  
3. **No enforcement = no adherence** - Guidelines were ignored
4. **Perfect is the enemy** - Over-engineering killed us

### Key Realization:
**The foundation's job is to PREVENT problems, not ENABLE everything**

## 💡 Recommendation: Option C (Hybrid) with Twists

### The Architecture:
```typescript
// 1. Core enforcer (immutable, ~100 lines total)
export class Foundation {
  static validate(type: ValidationType, context: any): ValidationResult {
    const rules = loadRules(type);
    return executeRules(rules, context);
  }
}

// 2. Rules in YAML (easy to read/modify)
package-size:
  max: 2KB
  severity: error
  
dependencies:
  allowed: ["@brutal/*"]
  severity: error

// 3. Patterns as docs + minimal code
// patterns/composition.md
## The Pattern
Use function composition, not inheritance

## The Code
```ts
export const compose = (...fns) => x => 
  fns.reduceRight((v, f) => f(v), x);
```

## The Test
```ts
test('compose works', () => {
  const add1 = x => x + 1;
  const double = x => x * 2;
  expect(compose(double, add1)(5)).toBe(12);
});
```
```

### Why This Works:
1. **Core stays simple** - Can't bloat 100 lines
2. **Rules stay readable** - YAML forces simplicity
3. **Patterns teach** - Docs + code + tests
4. **Everything testable** - But not everything needs TS

## 📏 Success Metrics

The foundation succeeds when:
1. V6 stays under 10KB for 1 year
2. No "alternative implementations" appear
3. New devs productive in 1 hour
4. Constraints catch problems before commit
5. We never need V7 to "fix architecture"

## 🚦 Decision Triggers

Choose Option C if:
- We want to start coding in < 1 day
- We value simplicity over flexibility
- We trust rules more than code

Reconsider if:
- We need complex validation logic
- We have > 5 contributors
- We need IDE constraint support

## 🎯 Next Steps

If approved:
1. Create minimal core validator (~1 hour)
2. Define 5 critical rules in YAML (~30 min)
3. Document 3 core patterns (~1 hour)
4. Write tests for validator (~30 min)
5. Start building packages (~3 hours in)

## ⏰ Time Impact

- Option A: 2-3 days foundation work
- Option B: 1-2 days + future parser work
- **Option C: 3-4 hours total**

## 🤔 The Ultimate Question

**What's the minimal foundation that prevents V5's mistakes?**

Answer: 
- 5 enforced rules (size, deps, patterns, APIs, duplication)
- 3 proven patterns (composition, state, events)
- 1 simple validator
- 0 ways to bypass

---

**Recommendation**: Option C - Start minimal, enforce strictly, expand only when proven necessary.