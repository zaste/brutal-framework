# 🧭 WHERE TO LOOK - Navigation Guide

## 🟢 For Active Development

### Current Work
```
packages/@brutal2/          # ALL new development here
scripts/brutal2/            # Current plans and progress
  - MASTER-PLAN-*.md       # The plan to follow
  - DAY-*-PROGRESS.md      # Daily progress tracking
  - EXECUTION-TIMELINE.md  # Schedule
```

### Continue From
1. Read: `scripts/brutal2/DAY-0-PROGRESS.md`
2. Follow: `scripts/brutal2/MASTER-PLAN-V5-BRUTAL2.md`
3. Implement: Day 1 - @brutal2/core

## 🟡 For Learning Only

### Best Minimal Examples
```
packages/@brutal/animation/src/minimal.ts     # GPU animations
packages/@brutal/validation/src/minimal.ts    # Schema validation
packages/@brutal/testing/src/minimal.ts       # Test runner
packages/@brutal/templates/src/minimal.ts     # Template engine
```

### Architecture Docs
```
foundation/ARCHITECTURE.md                    # Original V5 design
tools/README.md                              # Tooling overview
```

## 🔴 Do Not Use

### Abandoned Approaches
```
scripts/purification/     # Old cleanup approach - IGNORE
foundation/OPERATIONAL-STATUS-*.md  # Outdated plans
```

### Redundant Code
```
packages/@brutal/templates/src/compiler/   # 6 duplicate implementations
packages/@brutal/components/src/base/      # Multiple base classes
packages/@brutal/state/src/store/         # Redundant stores
```

## 📋 Quick Checklist

When starting work:
- [ ] Am I in @brutal2? (not @brutal)
- [ ] Am I following MASTER-PLAN?
- [ ] Am I checking DAY-*-PROGRESS?
- [ ] Am I ignoring purification/?

## 🎯 Current Focus

**TODAY**: Day 1 - Implement @brutal2/core (morning) and @brutal2/dom (afternoon)

**DO NOT**: 
- Edit anything in @brutal/*
- Follow purification plans
- Create new approaches

**DO**:
- Follow MASTER-PLAN exactly
- Track progress in DAY-* files
- Stay in @brutal2/*

---
**Remember**: @brutal2 is the future, @brutal is history