# RFC Process Pattern

## Problem
Large architectural decisions made without community input lead to poor adoption and technical debt. Ad-hoc decision making creates inconsistency.

## Solution
Structured Request for Comments (RFC) process that ensures major changes are thoroughly vetted by both core team and community before implementation.

### RFC Structure
```markdown
# RFC-XXXX: Title

**Status**: Draft | Active | Accepted | Rejected
**Author**: @username
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD

## Summary
Brief description of the proposal.

## Motivation
Why is this change necessary?

## Detailed Design
Complete technical specification.

## Alternatives Considered
Other approaches evaluated.

## Trade-offs
Pros and cons of the proposal.

## Migration Path
How existing code will be updated.

## Unresolved Questions
Open items for discussion.
```

### Decision Criteria
```yaml
# What requires an RFC
rfc_required:
  - New packages
  - Breaking changes
  - Bundle composition changes
  - Performance budget changes
  - New dependencies (should be zero)
  - Major architectural shifts

# What doesn't need RFC
pr_sufficient:
  - Bug fixes
  - Performance improvements
  - Documentation updates
  - Non-breaking features
  - Test improvements
```

### RFC Lifecycle
```typescript
enum RFCStatus {
  Draft = 'draft',           // Initial proposal
  Active = 'active',         // Open for comments
  FinalComment = 'final',    // Last call for comments
  Accepted = 'accepted',     // Approved for implementation
  Rejected = 'rejected',     // Not moving forward
  Implemented = 'implemented' // Completed
}

class RFCProcess {
  // 2-week comment period minimum
  static COMMENT_PERIOD = 14 * 24 * 60 * 60 * 1000;
  
  // 1-week final comment period
  static FINAL_PERIOD = 7 * 24 * 60 * 60 * 1000;
  
  async submitRFC(rfc: RFC): Promise<void> {
    // Validate RFC format
    this.validateRFC(rfc);
    
    // Assign number
    rfc.number = await this.getNextNumber();
    
    // Set initial status
    rfc.status = RFCStatus.Draft;
    rfc.created = new Date();
    
    // Create PR with RFC
    await this.createPR(rfc);
    
    // Notify relevant parties
    await this.notifyStakeholders(rfc);
  }
  
  async transitionToActive(rfc: RFC): Promise<void> {
    rfc.status = RFCStatus.Active;
    rfc.commentPeriodEnd = new Date(
      Date.now() + RFCProcess.COMMENT_PERIOD
    );
    
    // Announce comment period
    await this.announce(rfc, 'RFC is now active for comments');
  }
}
```

### Review Process
```javascript
// Automated RFC review checklist
class RFCReviewer {
  async review(rfc: RFC): Promise<ReviewResult> {
    const checks = [
      this.checkCompleteness,
      this.checkTechnicalSoundness,
      this.checkBackwardCompatibility,
      this.checkPerformanceImpact,
      this.checkSecurityImplications
    ];
    
    const results = await Promise.all(
      checks.map(check => check(rfc))
    );
    
    return {
      passed: results.every(r => r.passed),
      feedback: results.flatMap(r => r.feedback),
      blockers: results.filter(r => r.blocking)
    };
  }
  
  checkBackwardCompatibility(rfc: RFC): ReviewCheck {
    const breakingChanges = this.findBreakingChanges(rfc);
    
    if (breakingChanges.length > 0) {
      return {
        passed: rfc.migrationPath != null,
        feedback: 'Breaking changes require migration path',
        blocking: true
      };
    }
    
    return { passed: true };
  }
}
```

### Decision Matrix
```typescript
interface DecisionMatrix {
  technical: number;      // 0-10 technical merit
  community: number;      // 0-10 community support
  complexity: number;     // 0-10 implementation complexity
  maintenance: number;    // 0-10 long-term maintenance
}

class RFCDecision {
  // Minimum scores for acceptance
  static THRESHOLDS = {
    technical: 7,
    community: 6,
    complexity: 5,  // Lower is better
    maintenance: 6
  };
  
  evaluate(rfc: RFC, matrix: DecisionMatrix): Decision {
    const passes = 
      matrix.technical >= RFCDecision.THRESHOLDS.technical &&
      matrix.community >= RFCDecision.THRESHOLDS.community &&
      matrix.complexity <= RFCDecision.THRESHOLDS.complexity &&
      matrix.maintenance >= RFCDecision.THRESHOLDS.maintenance;
    
    return {
      accepted: passes,
      scores: matrix,
      rationale: this.generateRationale(matrix)
    };
  }
}
```

## Evolution
- V3: Ad-hoc decisions in issues
- V4: Basic design docs
- V5: Full RFC process with automation

## Trade-offs
- ✅ Transparent decision making
- ✅ Community involvement
- ✅ Documented rationale
- ✅ Better architecture
- ❌ Slower for major changes
- ❌ Process overhead

## Related
- [Governance Model](./governance.md)
- [Living Documentation](./living-documentation.md)
- [Migration Strategy](./migration-strategy.md)