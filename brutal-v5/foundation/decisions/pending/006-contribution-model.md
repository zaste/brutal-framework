# Decision: Contribution Model During Foundation

## Status: PENDING

## Context
CONTRIBUTING.md references "Phase 0" and "Phase 1", which contradicts our living foundation pattern that avoids phase-based thinking. We need to decide how to handle contributions during early development.

## Background
- Living foundation pattern says no phases
- But we have no code yet
- Contributors need clear guidance
- Different contribution types at different stages

## Options

### Option 1: Stage-Based Contribution
```markdown
Current Stage: Foundation (no code)
- Review documentation
- Architecture feedback
- Tooling suggestions

Next Stage: Implementation
- Code contributions
- Package ownership
- Testing
```

**Pros**: Clear expectations, easy to understand
**Cons**: Still implies phases, just renamed

### Option 2: Contribution Types
```markdown
Always Available:
- Documentation improvements
- Architecture patterns
- Decision input
- Tool recommendations

When Code Exists:
- Implementation
- Testing
- Performance optimization
```

**Pros**: No phases, just availability
**Cons**: May be less clear when to contribute what

### Option 3: Focus-Based Contribution
```markdown
Current Focus: Foundation & Decisions
How to help:
- Review 5 pending decisions
- Extract patterns from V3/V4
- Validate architecture assumptions

When Focus Shifts:
- New contribution opportunities
- Different skills needed
```

**Pros**: Aligns with iterative development
**Cons**: Requires frequent updates

## Recommendation

**Option 3: Focus-Based Contribution**

Aligns with our patterns:
- Living foundation (no phases)
- Iterative development (current focus)
- Continuous evolution

Implementation:
```markdown
## How to Contribute

### Current Focus: Foundation
We're extracting patterns and making architectural decisions.

You can help by:
- Reviewing [pending decisions](./foundation/decisions/pending/)
- Finding patterns in V3/V4 code
- Validating our assumptions

### Always Welcome:
- Documentation improvements
- Pattern suggestions
- Architecture feedback
```

## Trade-offs

### Chosen: Focus-Based
✅ Aligns with living foundation
✅ Natural evolution
✅ Clear current needs
⚠️ Requires maintenance
⚠️ May confuse traditional contributors

### Rejected: Phase-Based
❌ Contradicts core patterns
❌ Creates artificial barriers
❌ Implies completion

## Implementation Changes

1. Update CONTRIBUTING.md to remove phase language
2. Add "Current Focus" section
3. Link to iterative development pattern
4. Create update process for focus changes

## Decision Criteria
- Consistency with patterns: Critical
- Contributor clarity: Important
- Maintenance burden: Acceptable
- Community feedback: Pending

---

*Input needed: Is focus-based contribution model clear enough for contributors?*