# Decision: Monorepo Structure

**Status**: Accepted  
**Date**: 2024-07-10

## Context

Based on learnings from V3 (monolithic) and V4 (better but not modular enough), we needed a structure that supports independent packages while maintaining cohesion.

## Decision

True monorepo structure with independent packages under `packages/` directory.

```
packages/
├── foundation/
├── shared/
├── events/
└── ... (30+ packages)
```

## Key Points

- Each package has its own lifecycle
- Independent versioning possible (but we use lockstep)
- Shared tooling at root
- pnpm workspaces for dependency management

## Consequences

- Clear separation of concerns
- Easy to understand dependencies
- Can publish packages independently
- Requires monorepo tooling setup

## References

- Original discussion in ARCHITECTURE.md
- Feedback integrated from community review