# 🏛️ BRUTAL V6 Foundation Design
*The immutable constitution of our framework*

## 🎯 Purpose
The foundation is our defense against chaos. It contains:
1. **Principles** - What we believe
2. **Constraints** - What we enforce
3. **Protocols** - How we work
4. **Boundaries** - What we won't do

## 📁 Proposed Structure

```
foundation/
├── README.md                    # Foundation overview & navigation
├── PRINCIPLES.md               # Core beliefs (immutable)
├── ARCHITECTURE.md             # Technical decisions (immutable)
│
├── constraints/                # Executable enforcement
│   ├── index.ts               # Constraint runner
│   ├── zero-dependencies.ts   # No external deps
│   ├── composition-only.ts    # No inheritance
│   ├── size-limits.ts         # Bundle size enforcement
│   ├── no-duplication.ts      # Single implementation
│   └── api-surface.ts         # Minimal API constraint
│
├── protocols/                  # How we work
│   ├── DECISION.md            # Decision-making protocol
│   ├── DEVELOPMENT.md         # Development workflow
│   ├── TESTING.md             # Testing requirements
│   ├── RELEASE.md             # Release process
│   └── MAINTENANCE.md         # Long-term care
│
├── boundaries/                 # AI & human limits
│   ├── ai-boundaries.yaml     # What AI can/cannot do
│   ├── human-boundaries.yaml  # What humans must do
│   └── escalation-rules.md    # When to stop & ask
│
├── patterns/                   # Approved patterns
│   ├── composition.ts         # How to compose
│   ├── state-management.ts    # How to handle state
│   ├── event-handling.ts      # How to handle events
│   └── api-design.ts          # How to design APIs
│
└── validation/                 # Foundation self-check
    ├── validate-constraints.ts # Ensures constraints work
    ├── validate-patterns.ts    # Ensures patterns compile
    └── validate-foundation.ts  # Meta-validation
```

## 🔒 Immutability Rules

### What CANNOT Change (without new major version):
1. Core principles
2. Architecture decisions
3. Constraint definitions
4. API patterns

### What CAN Change:
1. Constraint implementations (if more accurate)
2. Validation improvements
3. Documentation clarifications
4. Example updates

## 📋 Foundation Components

### 1. PRINCIPLES.md
```markdown
# BRUTAL Principles

## 1. Zero Dependencies
- No external runtime dependencies
- No build-time framework dependencies
- Only browser APIs

## 2. Composition Over Inheritance
- Functions compose
- Behaviors attach
- No class hierarchies

## 3. Size as a Feature
- Every byte counts
- Constraints enforce limits
- Measure continuously

## 4. One Way Only
- Single implementation
- Single pattern
- No alternatives

## 5. User-Driven Development
- Ship early
- Get feedback
- Iterate based on use
```

### 2. Core Constraints (Executable)
```typescript
// Every principle becomes code
export interface Constraint {
  id: string;
  severity: 'error' | 'warning';
  validate(context: any): ValidationResult;
  fix?(context: any): void;
}
```

### 3. AI Boundaries (Machine-Readable)
```yaml
version: 1.0
enforced: true

never:
  - modify_foundation_principles
  - create_alternative_patterns  
  - ignore_size_constraints
  - add_external_dependencies
  - implement_multiple_ways

always:
  - check_constraints_first
  - follow_established_patterns
  - measure_bundle_size
  - escalate_uncertainty
  - preserve_immutability

escalate_when:
  - principle_conflict_detected
  - size_budget_exceeded
  - new_pattern_needed
  - constraint_violation_unclear
```

### 4. Decision Protocol
- Phase 1: Research (time-boxed)
- Phase 2: Decision (recorded)
- Phase 3: Execution (no revisiting)

## 🚀 Foundation Benefits

1. **Prevents Regression** - Constraints catch violations
2. **Enables Speed** - Clear boundaries = fast decisions
3. **Maintains Focus** - One way = no debates
4. **Ensures Quality** - Patterns enforce best practices
5. **Facilitates Handoff** - Next developer knows rules

## ❓ Key Questions to Resolve

1. Should constraints be in TypeScript or a DSL?
2. How do we version the foundation itself?
3. What's the process for foundation updates?
4. Should patterns include anti-patterns?
5. How do we handle edge cases in boundaries?

## 🎯 Success Metrics

The foundation succeeds when:
- [ ] No constraint violations in 30 days
- [ ] No foundation changes needed in 90 days
- [ ] New developers productive in 1 hour
- [ ] Bundle stays under 10KB for 6 months
- [ ] No duplicate implementations appear

---

**Next Step**: Review and refine each component before implementation.