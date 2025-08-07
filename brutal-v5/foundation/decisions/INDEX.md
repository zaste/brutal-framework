# 📋 BRUTAL V5 - Decision Registry

## Pending Decisions

Decisions currently being evaluated:

1. **[SSR Support Location](./pending/001-ssr-support.md)** - Where should Server-Side Rendering live?
2. **[Telemetry Implementation](./pending/002-telemetry.md)** - How to handle analytics/telemetry?
3. **[Error Package Structure](./pending/003-error-package.md)** - Dedicated error package or in shared?
4. **[SharedArrayBuffer Support](./pending/004-sharedarraybuffer.md)** - Core feature or enhanced package?
5. **[Template Cache Strategy](./pending/005-template-cache.md)** - How aggressive should caching be?

## Accepted Decisions

Decisions that have been made and implemented:

- **[Monorepo Structure](./accepted/monorepo-structure.md)** - True monorepo with independent packages
- **[Zero Dependencies](./accepted/zero-dependencies.md)** - No external runtime dependencies
- **[35KB Core Budget](./accepted/core-budget.md)** - Updated from 30KB based on learnings
- **[Test Co-location](./accepted/test-colocation.md)** - Tests next to source, stripped at build
- **[Security First](./accepted/security-first.md)** - ESLint security plugin required
- **[Knowledge Distillation](./accepted/knowledge-distillation.md)** - Progressive pattern extraction

## Decision Flow

```
pending/ → (evaluation) → accepted/ → ARCHITECTURE.md update → implementation
    ↑                                                              ↓
    ←────────────── learning feeds back ←──────────────────────────
```

## Decision Template

Each decision document should include:
- **Status**: Pending/Accepted/Superseded
- **Date**: When decided
- **Context**: Why this decision is needed
- **Options**: What alternatives were considered
- **Decision**: What was chosen and why
- **Consequences**: What changes as a result

---

*Decisions are living documents - they can be revisited as we learn.*