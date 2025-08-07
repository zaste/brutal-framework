# Package Exports Pattern

## Problem
Inconsistent module exports and public API definitions lead to breaking changes, poor discoverability, and maintenance challenges.

## Solution
Standardized package export structure with explicit exports field, type definitions, and clear public API boundaries.

### Implementation
```json
{
  "name": "@brutal/[name]",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "types"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### API Documentation Structure
```
docs/
├── README.md      # Overview and quick start
├── API.md         # Complete API reference
└── EXAMPLES.md    # Usage examples
```

### Export Conventions
- Single entry point per package
- Named exports over default exports
- Explicit re-exports from index
- No deep imports allowed
- Type definitions alongside code

## Evolution
- V3: Multiple entry points, inconsistent exports
- V4: Some standardization, incomplete
- V5: Fully standardized with explicit exports field

## Trade-offs
- ✅ Clear public API boundaries
- ✅ Tree-shaking enabled
- ✅ TypeScript support guaranteed
- ❌ No deep imports flexibility
- ❌ Breaking changes require major version

## Related
- [Modular Monorepo](../architecture/modular-monorepo.md)
- [Explicit Over Implicit](../../principles/explicit-over-implicit.md)