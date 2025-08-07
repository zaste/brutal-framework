# Contributing to BRUTAL V5

> ✅ **Distilled**: 2024-07-12
> - Contribution model → [pattern](./foundation/patterns/governance/contribution-model.md)
> - Quality standards → [pattern](./foundation/patterns/quality/automated-quality-gates.md)
> - Development setup → [pattern](./foundation/patterns/build/development-workflow.md)

Thank you for your interest in contributing to BRUTAL V5! 

## Current Focus: Foundation

We're extracting patterns and making architectural decisions. See our [contribution model](./foundation/patterns/governance/contribution-model.md) for details.

### How You Can Help Now
- **Review [5 pending decisions](./foundation/decisions/pending/)** - Your input shapes the framework
- **Extract patterns** from V3/V4 code - Find what worked
- **Validate assumptions** - Challenge our thinking
- **Improve documentation** - Clarity matters

## How to Contribute Now

### 1. Review Documentation
- Read all documents in order (see README.md)
- Look for inconsistencies or gaps
- Suggest improvements

### 2. Architecture Feedback
- Open issues for architectural concerns
- Propose alternative approaches with rationale
- Help refine the dependency graph

### 3. Tooling Suggestions
- Recommend tools that align with our principles
- Share experiences with monorepo setups
- Suggest performance measurement approaches

## When Code Exists

The contribution process will expand to include:

### 1. Find an Issue
- Look for "good first issue" labels
- Check package-specific issues
- Ask in discussions if unsure

### 2. Setup Development Environment
```bash
# Clone repository
git clone https://github.com/brutal/v5.git
cd v5

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development
pnpm dev
```

### 3. Make Changes
- Follow architecture guidelines
- Maintain 95% test coverage
- Follow coding standards
- Update documentation

### 4. Submit PR
- Run all checks locally
- Add changeset
- Clear description
- Link related issues

## Code Standards

### TypeScript
- Strict mode always
- No `any` without comment
- Explicit return types
- JSDoc for public APIs

### Testing
- Unit tests required
- Integration tests for APIs
- Performance tests for critical paths
- 95% coverage minimum

### Documentation
- README for every package
- JSDoc for every public function
- Examples for complex features
- Changelog entries

## Package Ownership

Each package has an owner responsible for:
- Architecture decisions
- Code reviews
- Performance
- Documentation

See [Governance](./foundation/standards/process/governance.md) for details.

## Communication

- **Issues**: Bug reports, feature requests
- **Discussions**: Questions, ideas
- **Discord**: Real-time chat (coming soon)
- **Twitter**: Updates (coming soon)

## Recognition

Contributors are recognized in:
- Package CHANGELOG.md
- GitHub contributors page
- Annual contributors report
- Conference mentions

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

We're committed to providing a welcoming and inclusive environment.

---

*Quality over quantity. Every contribution matters.*