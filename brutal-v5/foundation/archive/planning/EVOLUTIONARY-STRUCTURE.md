# 🔄 BRUTAL V5 - Evolutionary Directory Structure

## Core Principle: Living Documentation

Phase 0 is not a phase that ends - it's the **foundation layer** that continuously evolves with the project.

## Proposed Evolutionary Structure

```
brutal-v5/
├── README.md                    # Entry point (always current)
├── ARCHITECTURE.md              # Living architecture (updates with each decision)
├── ROADMAP.md                   # Current focus & next steps
│
├── foundation/                  # 🏗️ Living foundation docs (Phase 0 → ∞)
│   ├── decisions/              # Active decision tracking
│   │   ├── pending/            # Decisions being made
│   │   │   └── ssr-support.md
│   │   ├── accepted/           # Implemented decisions
│   │   │   └── monorepo-structure.md
│   │   └── INDEX.md            # Current state of all decisions
│   │
│   ├── principles/             # Core principles (evolve slowly)
│   │   ├── zero-dependencies.md
│   │   ├── modular-architecture.md
│   │   └── quality-first.md
│   │
│   ├── standards/              # Living standards
│   │   ├── quality/            # Quality gates
│   │   ├── structure/          # Package structure rules
│   │   └── process/            # How we work
│   │
│   └── learning/               # Continuous learning
│       ├── from-v3/            # What we learned from V3
│       ├── from-v4/            # What we learned from V4
│       └── ongoing/            # Current discoveries
│
├── packages/                    # Implementation (when ready)
├── examples/                    # Examples (when created)
├── scripts/                     # Tooling
└── .github/                     # CI/CD
```

## How It Evolves

### 1. Decisions Flow
```
foundation/decisions/pending/ → (decision made) → foundation/decisions/accepted/
                              ↓
                        ARCHITECTURE.md (updated)
                              ↓
                        Implementation in packages/
```

### 2. Learning Integration
```
New insight discovered → foundation/learning/ongoing/
                      ↓
                Principle refined → foundation/principles/
                      ↓
                Standard updated → foundation/standards/
```

### 3. Continuous Realignment
Instead of "completing" phases:
- Foundation docs are **living documents**
- Each package can influence foundation
- Discoveries feed back into principles

## Key Differences from Traditional Phases

### ❌ Traditional (Linear)
```
Phase 0 → Phase 1 → Phase 2 → Done
(frozen)   (frozen)   (active)
```

### ✅ Evolutionary (Circular)
```
Foundation ←→ Implementation ←→ Learning
   ↑               ↑               ↑
   └───────────────┴───────────────┘
        Continuous feedback loop
```

## Impact on Current Docs

### Reorganization Needed:
```bash
# Current (phase-based)
PHASE-0-FOUNDATION.md → foundation/README.md
PHASE-0-COMPLETE.md → Remove (phases never complete)
PENDING-DECISIONS.md → foundation/decisions/pending/
LESSONS-LEARNED.md → foundation/learning/from-v3-v4.md
ARCHITECTURE-V2.md → foundation/decisions/accepted/enhanced-architecture.md
```

### New Thinking:
- No "archive" - everything stays relevant
- No "completed" - everything can evolve
- No "phases" - just continuous improvement

## Benefits

1. **Adaptability** - Structure supports change
2. **Traceability** - See how decisions evolved
3. **Learning Loop** - Discoveries improve foundation
4. **No Debt** - No "old phase" docs to maintain

## Example: SSR Decision Flow

1. Start: `foundation/decisions/pending/ssr-support.md`
2. Discuss options, gather feedback
3. Decision made → `foundation/decisions/accepted/ssr-support.md`
4. Update `ARCHITECTURE.md` with decision
5. Implement in `packages/ssr/` (if separate) or `packages/foundation/`
6. Learn from implementation
7. Update `foundation/learning/ongoing/ssr-insights.md`
8. Refine principles if needed

## Questions This Raises

1. **How do we track decision history?**
   - Git history + decision docs with dates
   - Each decision doc has "History" section

2. **When do we refactor foundation docs?**
   - When patterns emerge from learning
   - When implementation reveals better ways

3. **How do we prevent doc sprawl?**
   - Regular consolidation cycles
   - Each area has an INDEX.md
   - Scripts to find orphaned docs

## Next Steps

1. **Transform phase docs** → living foundation docs
2. **Create decision flow** → pending/accepted structure  
3. **Establish feedback loops** → learning integration
4. **Remove "completion" mindset** → continuous evolution

---

*The foundation is never complete - it grows stronger with each iteration.*