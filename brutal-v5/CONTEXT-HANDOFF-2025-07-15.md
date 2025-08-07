# 🎯 Context Handoff - 2025-07-15
*Critical information for next session*

## 🚨 CURRENT STATE

### What We're Building
- **@brutal2** - Clean reimplementation in `packages/@brutal2/`
- **Target**: 8.5KB total (vs current 71KB)
- **Status**: Day 0 complete, Day 1 ready to start

### Where to Continue
1. **Read**: `WHERE-TO-LOOK.md` - Navigation guide
2. **Check**: `scripts/brutal2/DAY-0-PROGRESS.md` - Current progress
3. **Follow**: `scripts/brutal2/MASTER-PLAN-V5-BRUTAL2.md` - The plan
4. **Build**: `packages/@brutal2/core` - Next implementation

## 📊 KEY DISCOVERIES

### The Problems (Why Rebuild)
1. **7 template implementations** (only need 1)
2. **Inheritance instead of composition**
3. **152KB across 19 packages** (target: 8.5KB in 7 packages)
4. **No enforcement of principles**

### Root Causes Identified
- Evolution without refactoring (V3→V4→V5 accumulation)
- Fear-driven development (kept everything)
- Over-engineering (built for imaginary needs)
- No user feedback loop

## 🏗️ THE SOLUTION

### @brutal2 Architecture
```
packages/@brutal2/
├── core/      # 2KB - Composition utilities ⏳
├── dom/       # 2KB - Templates & rendering
├── state/     # 1KB - Reactive stores
├── events/    # 1KB - Event system
├── router/    # 1KB - SPA routing
├── animation/ # 1KB - GPU animations
└── utils/     # 0.5KB - Shared helpers
```

### Timeline
- Day 1: core + dom
- Day 2: state + events
- Day 3: router + animation
- Day 4: utils + integration
- Day 5: migration tools

## 🛡️ NEW SYSTEMS CREATED

### 1. Executable Constraints
```typescript
// foundation/constraints/
- zero-dependencies.ts    # Enforces no external deps
- composition-only.ts     # Prevents inheritance
- bundle-size.ts         # Enforces size limits
```

### 2. AI Boundaries
```yaml
# foundation/ai/boundaries.yaml
never:
  - create_new_principles
  - override_architecture_decisions
  - ignore_performance_budgets
always:
  - validate_against_constraints
  - suggest_within_patterns
  - escalate_uncertainty
```

### 3. Decision Protocol
- Phase 1: Time-boxed exploration
- Phase 2: Single decision point
- Phase 3: Execution only

## ⚠️ CRITICAL RULES

### DO NOT:
- Work in `packages/@brutal/` (legacy reference only)
- Follow `scripts/purification/` (abandoned approach)
- Create new approaches without decision
- Modify foundation constraints

### ALWAYS:
- Work in `packages/@brutal2/`
- Follow `MASTER-PLAN-V5-BRUTAL2.md`
- Check constraints before changes
- Track progress in DAY-* files

## 🎯 NEXT ACTIONS

### Immediate (Day 1 Morning):
1. Implement `@brutal2/core/src/index.ts`:
   - compose() function
   - withState() behavior
   - withEvents() behavior
   - withLifecycle() behavior
   - component() factory

2. Create tests for core
3. Validate size < 2KB
4. Update DAY-1-PROGRESS.md

### Key Code Patterns:
```typescript
// Composition pattern (NOT inheritance)
export const compose = (...fns) => x => 
  fns.reduceRight((v, f) => f(v), x);

// Proxy-based state (NOT classes)
export const withState = (initial) => (el) => {
  el.state = new Proxy(initial, {
    set(t, k, v) {
      t[k] = v;
      el.update?.();
      return true;
    }
  });
  return el;
};
```

## 📚 ESSENTIAL REFERENCES

### For Implementation:
- `scripts/brutal2/FEATURE-EXTRACTION-REPORT.md` - What features to include
- `scripts/brutal2/API-DESIGN-OPTIMAL.md` - API surface design
- `packages/@brutal/*/src/minimal.ts` - Learn from these patterns

### For Decisions:
- `foundation/DECISION-PROTOCOL.md` - How we make decisions
- `foundation/constraints/` - Executable constraints
- `ROOT-CAUSE-ANALYSIS.md` - Why we're rebuilding

### For Navigation:
- `WHERE-TO-LOOK.md` - Main navigation
- `DIRECTORY-STATUS-PLAN.md` - What's what
- `foundation/ACTIVE-STATUS.md` - Current focus

## 💡 CONTEXT PRESERVATION

### Key Insights:
1. **Constraints enable speed** - Without them, we created chaos
2. **Ship early with users** - Not perfect in isolation  
3. **Delete aggressively** - We kept too much
4. **One way only** - Not 7 implementations

### Learned Patterns:
- Ultra-minimal with single letters works
- Proxy-based state feels natural
- Composition > inheritance always
- Size constraints force clarity

### Our Agreement:
- You provide constraints, I work within them
- Decisions are final unless new data
- We both enforce systematically
- Learn from violations, update constraints

---

**REMEMBER**: We're building @brutal2 clean, not purifying @brutal. Stay focused on the new implementation following the established plan.