# 🚀 Quick Start - Next Session

## Where We Are
Building @brutal2 - clean implementation (8.5KB vs 71KB current)

## What to Do Next

### 1. Read These First
```bash
cat WHERE-TO-LOOK.md                    # Navigation guide
cat CONTEXT-HANDOFF-2025-07-15.md      # Full context
cat scripts/brutal2/DAY-0-PROGRESS.md   # Current progress
```

### 2. Continue Implementation
```bash
cd packages/@brutal2/core
# Implement: compose, withState, withEvents, withLifecycle, component
# Target: 2KB max
# Pattern: Composition only, no classes
```

### 3. Check Constraints
```bash
# Before ANY code:
cat foundation/constraints/*.ts         # Executable rules
cat foundation/ai/boundaries.yaml       # AI limits
```

## Key Reminders
- Work ONLY in @brutal2/
- NO inheritance (except HTMLElement)
- NO external dependencies
- ENFORCE size limits
- FOLLOW the plan exactly

## Day 1 Goals
- [ ] Morning: @brutal2/core (2KB)
- [ ] Afternoon: @brutal2/dom (2KB)
- [ ] Tests for both
- [ ] Update progress

---
Start here → `packages/@brutal2/core/src/index.ts`