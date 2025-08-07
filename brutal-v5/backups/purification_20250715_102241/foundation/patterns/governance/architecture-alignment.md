# Pattern: Architecture Alignment

## Problem
Architecture documentation becomes misaligned with implementation reality, causing:
- Conflicting information across documents
- Inconsistent package structures
- Violation of established patterns
- Confusion about the "source of truth"

## Context
This pattern was discovered during V5 planning when we found:
- Phase terminology contradicting "living foundation" principle
- Package structures not matching templates
- Multiple conflicting architecture descriptions
- 32.5% compliance with our own standards

## Solution
Maintain a single, perfect architecture document that:
1. Consolidates ALL requirements
2. Shows complete structure for EVERY package
3. Includes validation checklists
4. Enforces through automation

## Implementation

### 1. Single Source of Truth
```markdown
# PERFECT-V5-ARCHITECTURE.md
- Complete package list with sizes
- Exact directory structure
- File-by-file breakdown
- No ambiguity, no "see other doc"
```

### 2. Automated Enforcement
```javascript
// scripts/validate-structure.js
function validatePackage(packagePath) {
  const required = [
    'src/index.ts',
    'src/index.test.ts',
    'tests/',
    'types/',
    'docs/README.md',
    'docs/API.md',
    'docs/EXAMPLES.md',
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    '.eslintrc.js',
    'CHANGELOG.md'
  ];
  
  const missing = required.filter(file => 
    !fs.existsSync(path.join(packagePath, file))
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }
}
```

### 3. Pre-Implementation Validation
```yaml
# .github/workflows/architecture.yml
- name: Validate Architecture Alignment
  run: |
    npm run validate:structure
    npm run check:dependencies
    npm run verify:patterns
```

### 4. Regular Alignment Checks
```typescript
// Weekly architecture review
interface ArchitectureReview {
  checkForConflicts(): Conflict[];
  validateCompliance(): ComplianceReport;
  updatePerfectArchitecture(): void;
  generateComplianceReport(): void;
}
```

## Key Insights

### What Causes Misalignment

1. **Multiple Documents Syndrome**
   - Information scattered across files
   - Each doc evolves independently
   - No clear hierarchy

2. **Partial Updates**
   - Change made in one place
   - Other docs not updated
   - Drift accumulates

3. **Assumption Gaps**
   - "Obviously" it should be X
   - Not explicitly documented
   - Different interpretations

4. **Template vs Reality**
   - Template says one thing
   - Implementation does another
   - No validation catches it

### Prevention Strategies

1. **Single Perfect Architecture**
   ```
   foundation/
   └── PERFECT-V5-ARCHITECTURE.md  # THE source of truth
   ```

2. **Automated Generation**
   ```bash
   # Generate package from perfect template
   npm run create:package -- --from-perfect
   ```

3. **Continuous Validation**
   ```javascript
   // Pre-commit hook
   if (!validateAgainstPerfectArchitecture()) {
     throw new Error('Architecture violation detected');
   }
   ```

4. **Living Compliance Report**
   ```markdown
   # COMPLIANCE-STATUS.md (auto-generated)
   Last checked: 2024-07-12 15:30 UTC
   Overall compliance: 100% ✅
   ```

## Examples

### Before (Misaligned)
```
README.md: "11 core packages"
ARCHITECTURE.md: "Core packages (35KB)"  
patterns/: "Components use WeakMap"
implementation/: Components missing WeakMap
```

### After (Aligned)
```
PERFECT-V5-ARCHITECTURE.md:
- 11 core packages (54KB total)
- @brutal/components uses WeakMap storage
- [Complete implementation details]

All other docs reference this single source.
```

## Consequences

### Benefits
- Zero confusion about structure
- 100% compliance achievable
- Automated validation possible
- New contributors have clarity

### Trade-offs
- Must maintain one comprehensive document
- Changes require updating perfect architecture
- Initial setup more rigorous

## Related Patterns
- [Living Documentation](./living-documentation.md)
- [Structure Validation](../quality/structure-validation.md)
- [Single Source of Truth](../architecture/single-source-truth.md)

## Anti-Patterns to Avoid
- Multiple competing architecture docs
- "See other document" references
- Implicit assumptions
- Manual compliance checking

## Validation
```bash
# This pattern is validated by
npm run check:architecture-alignment
```

---

*Discovered during V5 planning when finding 67.5% non-compliance with our own standards.*