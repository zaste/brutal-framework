# 🛡️ BRUTAL V6 Foundation

The constitution that prevents regression.

## 🎯 What is Foundation?

Foundation is our defense against chaos. It enforces the 6 BRUTAL principles through automated validation that **cannot be bypassed**.

## 📋 The 6 Principles

1. **ZERO_DEPS** - No external runtime dependencies
2. **COMPOSITION** - No inheritance (except HTMLElement)
3. **SIZE_FIRST** - Every byte justifies its existence (2KB limit)
4. **ONE_WAY** - Single implementation per feature
5. **USER_DRIVEN** - Features are requested, not imagined
6. **AMBITIOUS** - 8.5KB must beat 300KB at everything important

## 🚀 Quick Start

### Setup (One Time)
```bash
# Run the setup script
./foundation/enforce/setup.sh

# This installs:
# - Git pre-commit hooks
# - GitHub Actions workflow
# - npm scripts
# - Runtime monitoring
```

### Daily Usage
```bash
# Check for violations
npm run foundation:validate

# Auto-fix violations
npm run foundation:fix

# Start continuous monitoring (dev)
npm run foundation:monitor
```

## 🏗️ Architecture

```
foundation/
├── index.ts          # Export: validate() ONLY
├── principles.ts     # The 5 principles as executable code
├── validate.ts       # The validation engine
├── invariants.ts     # Critical checks that cannot fail
├── rules/           # Validation rules
│   ├── size.ts      # 2KB limit enforcement
│   ├── dependencies.ts # Zero deps enforcement
│   ├── composition.ts  # No inheritance enforcement
│   ├── duplication.ts  # Single implementation
│   ├── patterns.ts     # Approved patterns only
│   └── framework-growth.ts # Anti-V5 explosion
├── enforce/         # Enforcement mechanisms
│   ├── pre-commit   # Git hook (uncircumventable)
│   ├── monitor.ts   # Continuous validation
│   ├── ci.yml       # GitHub Actions
│   ├── setup.sh     # One-time installation
│   └── north-star-check.sh # Goal reminder
├── patterns/        # Approved patterns (as tests)
│   ├── composition.test.ts
│   ├── state.test.ts
│   ├── events.test.ts
│   └── v6-core-pattern.test.ts # V6 discipline
├── decisions/       # Historical decisions
│   ├── 001-zero-dependencies.md
│   ├── 002-composition-only.md
│   ├── 003-size-as-feature.md
│   ├── 004-package-architecture.md
│   ├── 005-parallel-development.md
│   ├── 006-dual-api-strategy.md
│   ├── 007-examples-as-tests.md
│   └── 008-lessons-from-v3-v5.md # CRITICAL
└── docs/           # Design process history
```

## 📍 Status

See [FOUNDATION-STATUS.md](./FOUNDATION-STATUS.md) for current state.

### The API

```typescript
import { validate } from './foundation';

// That's it. One function.
const result = await validate('.', { fix: true });
console.log(result.summary);
```

## 🔒 Enforcement Layers

### 1. Pre-commit Hook
- Blocks commits with violations
- Cannot be bypassed with `--no-verify`
- No environment variable overrides

### 2. CI/CD Pipeline
- GitHub Actions workflow
- Required status check
- Blocks PR merge on failure

### 3. Runtime Monitor
- Continuous validation in development
- Auto-fix capability
- Alerts on violations

## 📚 Required Reading

Before implementing V6, understand why V3-V5 failed and what we're building:
- **[Lessons from V3-V5](./decisions/008-lessons-from-v3-v5.md)** - Critical failures to avoid
- **[Aggressive Ambition](./decisions/009-aggressive-ambition.md)** - NO COMPROMISE vision

## 📏 The Rules

### 1. Size Limit (`size.ts`)
- Max 2KB per package
- Measured on dist/index.js
- Auto-fix through aggressive minification

### 2. Zero Dependencies (`dependencies.ts`)
- No external runtime dependencies
- Only @brutal/* internal deps allowed
- Strict devDependencies allowlist

### 3. Composition Only (`composition.ts`)
- No class inheritance (except HTMLElement)
- No React class components
- Enforces functional patterns

### 4. No Duplication (`duplication.ts`)
- One implementation per feature
- No alternative versions (minimal.ts vs index.ts)
- No backup/temp/old files

### 5. Approved Patterns (`patterns.ts`)
- No console.* statements
- No `any` types
- No innerHTML usage
- No eval() or new Function()

## 🎨 Patterns

See `patterns/*.test.ts` for executable documentation:

- **composition.test.ts** - Function composition patterns
- **state.test.ts** - Reactive state management
- **events.test.ts** - Event handling patterns

These tests ARE the documentation. Copy the patterns exactly.

## ❌ Cannot Be Disabled

The following attempts to bypass validation will FAIL:

```bash
# All of these are blocked:
FORCE=1 git commit
SKIP_VALIDATION=1 git commit
git commit --no-verify
git push --force
```

Admins cannot bypass. CI cannot be skipped. This is by design.

## 🔧 Extending Foundation

### Adding a New Rule

1. Create `rules/newrule.ts`:
```typescript
export const newRule: Rule = {
  name: 'new-rule',
  appliesTo: (type) => type === 'package',
  async validate(target) {
    // Validation logic
    return { valid: true, violations: [] };
  }
};
```

2. Export from `rules/index.ts`
3. Rule is automatically enforced

### Adding a Pattern

1. Create `patterns/newpattern.test.ts`
2. Write tests that demonstrate the pattern
3. Tests pass = pattern is approved

## 📊 Metrics

Foundation succeeds when:
- [ ] 0 violations in 6 months
- [ ] < 500 lines of code maintained
- [ ] 100% automation (no manual steps)
- [ ] New devs productive in 1 hour

## 🚨 Troubleshooting

### "Validation Failed"
```bash
npm run foundation:validate  # See specific violations
npm run foundation:fix      # Auto-fix if possible
```

### "Cannot commit"
The pre-commit hook is blocking due to violations. Fix them first.

### "CI failing"
Check the GitHub Actions log for specific violations.

## 🎯 Philosophy

> "Constraints enable speed. Decisions enable progress. Enforcement enables both."

Foundation is not about what you CAN do, it's about what you CAN'T do. By making bad patterns impossible, good patterns become inevitable.

---

**Remember**: You cannot disable, bypass, or override Foundation. This is intentional. Embrace the constraints.