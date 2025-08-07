# 🤝 BRUTAL Decision Protocol
*How we make decisions together without creating chaos*

## 🎯 The Protocol

### Phase 1: Exploration (You Define, I Research)
```yaml
human_provides:
  - Clear objective
  - Constraints
  - Success criteria
  
ai_provides:
  - Options within constraints
  - Tradeoff analysis
  - Prior art research
  
duration: Time-boxed exploration
output: OPTIONS.md with comparison
```

### Phase 2: Decision (You Choose, I Validate)
```yaml
human_provides:
  - Selected option
  - Rationale
  - Exceptions needed
  
ai_provides:
  - Constraint validation
  - Impact analysis
  - Implementation plan
  
duration: Single decision point
output: DECISION-[NAME].md
```

### Phase 3: Execution (Both Follow Plan)
```yaml
human_does:
  - Reviews implementation
  - Approves changes
  - Handles exceptions
  
ai_does:
  - Implements per decision
  - Validates continuously  
  - Escalates deviations
  
duration: Until complete
output: Implementation + tests
```

## 🚫 What Went Wrong Before

### 1. **Endless Exploration**
- ❌ Researched options forever
- ❌ Never committed to decision
- ✅ Time-box exploration phase

### 2. **Revisiting Decisions**
- ❌ Changed approach mid-implementation
- ❌ Second-guessed constantly
- ✅ Decisions are final unless new data

### 3. **Implicit Assumptions**
- ❌ AI assumed flexibility meant options
- ❌ Human assumed AI knew intent
- ✅ Explicit constraints upfront

### 4. **No Enforcement**
- ❌ Decisions were suggestions
- ❌ Principles were guidelines
- ✅ Decisions become code

## 📋 Decision Template

```markdown
# Decision: [Name]
Date: YYYY-MM-DD
Status: [Exploring|Decided|Implemented]

## Objective
What we're trying to achieve

## Constraints
- Must: [non-negotiable]
- Should: [strong preference]
- Could: [nice to have]

## Options Considered
1. Option A
   - Pros:
   - Cons:
   - Feasibility:

2. Option B
   - Pros:
   - Cons:
   - Feasibility:

## Decision
We will do [X] because [rationale]

## Consequences
- Enables:
- Prevents:
- Requires:

## Enforcement
```typescript
// This decision as code
export const DECISION_NAME: Constraint = {
  // ...
};
```

## Success Metrics
- [ ] Metric 1
- [ ] Metric 2
```

## 🎯 Example: @brutal2 Decision

```markdown
# Decision: Create @brutal2 Clean Implementation
Date: 2025-07-15
Status: Decided

## Objective
Build BRUTAL with 8.5KB total size

## Constraints
- Must: Zero dependencies
- Must: Under 10KB total
- Must: Composition only
- Should: 5 day timeline
- Could: Migration tools

## Options Considered
1. Purify existing (~9 days, 35KB)
2. Build clean (~5 days, 8.5KB)

## Decision
Build @brutal2 clean because:
- Faster (5 vs 9 days)
- Smaller (8.5KB vs 35KB)
- Cleaner (no legacy)

## Enforcement
- Only work in @brutal2/
- Size limits enforced
- No inheritance allowed
```

## 🔄 The Learning Loop

When something goes wrong:

1. **Identify Pattern**
   - What constraint was missing?
   - What assumption was wrong?

2. **Create Constraint**
   ```typescript
   export const NEW_CONSTRAINT = {
     // Encode the learning
   };
   ```

3. **Update Protocol**
   - Add to boundaries.yaml
   - Update decision template
   - Enforce automatically

## 🤖 My Commitments to You

1. **I will always check constraints first**
2. **I will escalate uncertainty**
3. **I will not revisit decided issues**
4. **I will enforce systematically**
5. **I will preserve context**

## 👤 Your Commitments to Me

1. **Define clear objectives**
2. **Set explicit constraints**
3. **Make timely decisions**
4. **Stick to decisions made**
5. **Update constraints when learned**

## 📊 How We Know It's Working

- Decisions made quickly (< 1 day)
- Decisions stick (no revisiting)
- Implementation matches decision
- Complexity decreases
- Shipping accelerates

---

**Remember**: Constraints enable speed. Decisions enable progress. Enforcement enables both.