# Principle: Pragmatic Tooling

> **Don't rebuild what's been perfected, unless you can perfect it further.**

## The Principle

Build tools that add unique value. Use existing tools where they excel. Be pragmatic, not dogmatic.

## Decision Framework

```mermaid
Is it runtime code?
├─ YES → Zero dependencies (strict)
└─ NO → Is it development tooling?
    ├─ YES → Does it provide unique value?
    │   ├─ YES → Build it (our monitoring, compatibility tools)
    │   └─ NO → Use existing (Jest, ESLint, TypeScript)
    └─ NO → Evaluate case by case
```

## Examples of Pragmatic Choices

### ✅ We BUILD These (Unique Value):
- **Performance monitoring**: Specific to our architecture
- **Bundle tracking**: Tailored to our 6KB/package goals
- **Version compatibility**: Our specific matrix needs
- **Migration tools**: Framework-specific transforms

### ✅ We USE These (Solved Problems):
- **Test runner**: Jest (mature, feature-complete)
- **Linter**: ESLint (extensible, standard)
- **Bundler**: Rollup/tsup (proven, configurable)
- **Type checker**: TypeScript (industry standard)

## The Value Test

Before building a tool, answer:
1. **What unique problem does this solve?**
2. **How does this improve on existing solutions?**
3. **Is the improvement worth the maintenance cost?**
4. **Will this accelerate or hinder development?**

## Anti-Patterns to Avoid

### ❌ NIH Syndrome (Not Invented Here)
```typescript
// BAD: Rebuilding Jest because "zero dependencies"
export class BrutalTestRunner { /* 10,000 lines later... */ }

// GOOD: Using Jest for development
import { test } from '@jest/globals';
```

### ❌ Purity Over Productivity
```typescript
// BAD: "We must control everything"
class BrutalTypeScriptCompiler { }

// GOOD: Focus on framework value
import typescript from 'typescript'; // in build tools only
```

## The Time Equation

```
Time saved by using existing tool
- Time to integrate existing tool  
- Unique features we can't get elsewhere
= Net value

If Net value > 0: Use existing tool
If Net value < 0: Build our own
```

## Maintenance Reality

Every tool we build means:
- 🐛 Bugs to fix
- 📚 Documentation to write
- 🔧 Features to add
- 🏗️ Breaking changes to manage
- 👥 Community questions to answer

## The Focus Principle

Our energy is finite. Every hour spent on tooling is an hour not spent on:
- Core framework features
- Performance optimizations
- Developer experience
- Documentation
- Community building

## Practical Guidelines

1. **Runtime = Zero deps** (non-negotiable)
2. **Dev tools = Best tool** (negotiable)
3. **Unique value = Build** (strategic)
4. **Commodity = Buy/Use** (pragmatic)

## Success Metrics

We've made the right choice when:
- ✅ Development velocity increases
- ✅ Maintenance burden is manageable
- ✅ Developers are productive
- ✅ We're innovating where it matters
- ❌ We're NOT stuck maintaining a Jest clone

## References

- Learned from test-extractor tangent
- Inspired by successful frameworks' choices
- Based on real maintenance experience