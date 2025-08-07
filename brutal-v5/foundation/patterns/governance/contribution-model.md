# Pattern: Contribution Model

## Problem
Open source projects need clear contribution guidelines that:
- Set quality expectations
- Guide different skill levels
- Maintain consistency
- Scale with growth
- Adapt to project evolution

## Solution
Implement a multi-tier contribution model with clear standards, ownership, and recognition.

## Implementation

### Contribution Tiers

#### 1. Documentation & Feedback
```markdown
# Always welcome, no code required
- Fix typos and improve clarity
- Report unclear documentation
- Suggest better examples
- Share use case experiences
```

#### 2. Issue Reporting
```markdown
# Template-driven reporting
## Bug Report
- Environment details
- Reproduction steps
- Expected vs actual
- Minimal reproduction

## Feature Request
- Use case description
- Current workaround
- Proposed solution
- Trade-offs considered
```

#### 3. Code Contributions
```javascript
// Standards enforced automatically
{
  "coverage": "95% minimum",
  "types": "strict mode",
  "linting": "no warnings",
  "tests": "all passing",
  "docs": "updated"
}
```

#### 4. Package Ownership
```markdown
# Responsibilities
- Architecture decisions
- Code review for package
- Performance monitoring
- Documentation quality
- Breaking change decisions
```

### Quality Gates

#### Pre-Commit
```bash
# husky + lint-staged
- ESLint fixes
- Prettier formatting
- Type checking
- Test execution
```

#### Pull Request
```yaml
# GitHub Actions
- Full test suite
- Coverage check
- Bundle size check
- Performance tests
- Security scan
```

#### Review Requirements
```javascript
const reviewRequirements = {
  trivial: {
    reviews: 1,
    owner: false,
    tests: 'existing pass'
  },
  
  feature: {
    reviews: 2,
    owner: true,
    tests: 'new required',
    docs: 'required'
  },
  
  breaking: {
    reviews: 3,
    owner: true,
    rfc: 'required',
    migration: 'required'
  }
};
```

### Development Setup

#### Monorepo Tooling
```bash
# Quick start
git clone https://github.com/brutal/v5.git
cd v5
pnpm install    # Workspace management
pnpm test       # All packages
pnpm dev        # Development mode
```

#### Package Development
```bash
# Work on specific package
cd packages/core
pnpm test:watch  # TDD mode
pnpm build       # Verify build
pnpm size        # Check size
```

### Contribution Process

#### 1. Find Work
```javascript
// Issue labels
labels = {
  'good-first-issue': 'New contributors',
  'help-wanted': 'Community input needed',
  'package:core': 'Specific package',
  'breaking': 'Needs RFC',
  'performance': 'Needs benchmarks'
};
```

#### 2. Claim Issue
```markdown
# Comment on issue
"I'd like to work on this. My approach would be..."

# Get confirmation
Maintainer assigns issue
```

#### 3. Development Flow
```bash
# Feature branch
git checkout -b feature/issue-123

# Regular commits
git commit -m "feat(core): add feature"

# Stay updated
git rebase main
```

#### 4. Pull Request
```markdown
## PR Description
Fixes #123

### Changes
- Added X feature
- Updated Y docs
- Added Z tests

### Breaking Changes
None

### Performance Impact
Benchmarks show no regression
```

### Code Standards

#### TypeScript Requirements
```typescript
// Required patterns
export function myFunction(param: string): Result {
  // Explicit types everywhere
}

// No any without justification
const value: any; // TODO: Remove when Types available

// Strict null checks
const safe = value ?? defaultValue;
```

#### Testing Patterns
```javascript
describe('Component', () => {
  // Arrange-Act-Assert
  it('should handle edge case', () => {
    // Arrange
    const input = createEdgeCase();
    
    // Act
    const result = component.process(input);
    
    // Assert
    expect(result).toMatchSnapshot();
  });
  
  // Coverage for all branches
  it.each([
    [null, 'default'],
    [undefined, 'default'],
    ['value', 'value']
  ])('handles %p correctly', (input, expected) => {
    expect(process(input)).toBe(expected);
  });
});
```

#### Documentation Standards
```javascript
/**
 * Creates a reactive state object
 * @param initial - Initial state value
 * @returns Proxy-wrapped reactive state
 * @example
 * ```js
 * const state = createState({ count: 0 });
 * state.count++; // Triggers updates
 * ```
 */
export function createState<T>(initial: T): T {
```

### Recognition System

#### Automated
```javascript
// .github/workflows/recognize.yml
on:
  pull_request:
    types: [closed]

jobs:
  recognize:
    if: github.event.pull_request.merged == true
    steps:
      - Update contributors list
      - Add to changelog
      - Tweet thanks (if major)
```

#### Manual
```markdown
# Quarterly recognition
- Top contributors blog post
- Conference shoutouts
- Swag for significant contributions
- Maintainer invitations
```

### Communication Channels

#### Async (Preferred)
- **GitHub Issues**: Bugs, features
- **GitHub Discussions**: Questions, RFCs
- **Pull Requests**: Code review

#### Sync (Scheduled)
- **Discord**: Office hours (weekly)
- **Video calls**: Architecture decisions
- **Twitter Spaces**: Community updates

## Evolution

### Early Stage
- Focus on architecture feedback
- Documentation contributions
- Pattern extraction
- Tool recommendations

### Growth Stage
- Code contributions
- Package ownership
- Performance optimization
- Feature development

### Mature Stage
- Maintenance mode
- Security patches
- Major version planning
- Ecosystem growth

## Success Metrics

### Contributor Health
- First PR merge time: < 1 week
- Contributor retention: > 60%
- Issue resolution time: < 2 weeks
- PR review time: < 48 hours

### Code Health
- Coverage maintained: > 95%
- Performance maintained: No regression
- Bundle size maintained: Within budget
- Security issues: Zero tolerance

## Anti-Patterns

### Avoiding
- ❌ "Move fast and break things"
- ❌ Accepting low quality for speed
- ❌ Unclear ownership
- ❌ Inconsistent standards

### Embracing
- ✅ Quality over quantity
- ✅ Clear communication
- ✅ Automated enforcement
- ✅ Recognition and appreciation

## References
- Code of Conduct
- Governance Model
- Quality Standards
- Living Documentation

---

*Every contribution improves BRUTAL.*