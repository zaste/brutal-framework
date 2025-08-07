# Pattern: Modular Monorepo Architecture

## Problem
Traditional approaches fail at scale:
- **Monolith**: Everything coupled, can't tree-shake, massive bundles
- **Multi-repo**: Versioning hell, dependency sync nightmares
- **False modularity**: Claims modular but actually interdependent

## Context
Use when building a framework that needs:
- Independent feature adoption
- Clear dependency management
- Multiple bundle strategies
- Consistent tooling

## Solution
True monorepo with genuinely independent packages sharing only tooling.

## Implementation

### Directory Structure
```
brutal-v5/
├── packages/
│   ├── foundation/         # @brutal/foundation
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json   # Independent package
│   │   └── README.md
│   ├── shared/            # @brutal/shared
│   └── [30+ packages]
├── pnpm-workspace.yaml    # Monorepo config
├── tsconfig.json         # Shared TS config
└── .eslintrc.js         # Shared lint config
```

### Package Independence
```json
// packages/state/package.json
{
  "name": "@brutal/state",
  "version": "1.0.0",
  "dependencies": {
    "@brutal/shared": "workspace:^",
    "@brutal/events": "workspace:^"
  },
  "peerDependencies": {},  // NO peer deps
  "devDependencies": {
    "@brutal/test-utils": "workspace:^"
  }
}
```

### Dependency Rules
```javascript
// scripts/validate-dependencies.js
const ALLOWED_DEPS = {
  '@brutal/foundation': [],  // No deps
  '@brutal/shared': [],      // No deps
  '@brutal/events': ['@brutal/shared'],
  '@brutal/state': ['@brutal/shared', '@brutal/events'],
  // ... explicit dependency graph
};

function validatePackage(pkg) {
  const deps = Object.keys(pkg.dependencies || {});
  const allowed = ALLOWED_DEPS[pkg.name] || [];
  
  const violations = deps.filter(d => 
    d.startsWith('@brutal/') && !allowed.includes(d)
  );
  
  if (violations.length > 0) {
    throw new Error(`Invalid dependencies: ${violations}`);
  }
}
```

### Bundle Composition
```javascript
// Bundle definitions in code
export const BUNDLES = {
  lite: [
    '@brutal/foundation',
    '@brutal/shared',
    '@brutal/templates',
    '@brutal/components'
  ],
  core: [
    ...BUNDLES.lite,
    '@brutal/events',
    '@brutal/state',
    '@brutal/routing',
    // ... explicit composition
  ]
};
```

## Key Insights

### 1. True Independence
- Each package can be used standalone
- No implicit dependencies
- Clear contracts between packages

### 2. Shared Nothing (Except Tooling)
- Packages share build config
- But zero runtime dependencies between unrelated packages
- Explicit dependency graph

### 3. Bundle Strategy
- Predefined bundles for common use cases
- Custom bundle support
- Tree-shaking for optimal size

## Trade-offs

✅ **Benefits**:
- Use only what you need
- Clear dependency graph
- Independent evolution
- Consistent tooling

⚠️ **Considerations**:
- More packages to manage
- Requires discipline
- Initial setup complexity

## Anti-patterns to Avoid

### ❌ Hidden Dependencies
```javascript
// BAD: Assumes global exists
if (window.BrutalState) {
  // Hidden dependency!
}

// GOOD: Explicit import
import { createState } from '@brutal/state';
```

### ❌ Circular Dependencies
```javascript
// BAD: A imports B, B imports A
// state imports events, events imports state

// GOOD: One-way flow
// shared → events → state
```

### ❌ Kitchen Sink Packages
```javascript
// BAD: One package does everything
@brutal/core (100KB)

// GOOD: Focused packages
@brutal/events (5KB)
@brutal/state (6KB)
@brutal/routing (6KB)
```

## References
- V5: Current architecture in ARCHITECTURE.md
- Decision: foundation/decisions/accepted/monorepo-structure.md
- Prior art: Lerna, Nx, Turborepo (but we use pnpm)

---

*True modularity requires true independence.*