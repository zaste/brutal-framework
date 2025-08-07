# 📦 Package Creation Patterns

> Extracted from V5 implementation to ensure consistency across all packages

## Core Principles

1. **Zero Runtime Dependencies** - Only workspace dependencies allowed
2. **Consistent Structure** - Every package identical
3. **Co-located Tests** - Always `.test.ts` next to source
4. **Complete Documentation** - README, API, EXAMPLES required
5. **Size Budgets** - Enforced via size-limit

## Package Structure

```
packages/@brutal/[name]/
├── src/
│   ├── index.ts              # Main entry, re-exports public API
│   ├── index.test.ts         # Entry point tests
│   ├── types.ts              # Package-specific types
│   ├── constants.ts          # Package constants
│   └── [feature]/            # Feature subdirectories
│       ├── [feature].ts
│       ├── [feature].test.ts
│       └── helpers/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── performance/
├── types/
│   ├── index.d.ts           # Public type exports
│   ├── global.d.ts          # Global augmentations
│   └── internal.d.ts        # Internal types
├── docs/
│   ├── README.md
│   ├── API.md
│   └── EXAMPLES.md
├── examples/
│   ├── basic.html
│   ├── advanced.html
│   └── integration.html
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── jest.config.js
└── LICENSE
```

## Configuration Templates

### package.json
```json
{
  "name": "@brutal/[name]",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "size-limit": [{
    "path": "dist/index.js",
    "limit": "[SIZE]KB"
  }]
}
```

### tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  external: [/@brutal\//],
  treeshake: true
});
```

## Package-Specific Subdirectories

```javascript
const PACKAGE_SUBDIRS = {
  a11y: ['focus', 'announcer', 'keyboard', 'screen-reader'],
  plugins: ['loader', 'registry', 'hooks', 'lifecycle']
};
```

## Dependency Graph

```javascript
const DEPENDENCIES = {
  a11y: [],
  plugins: ['events', 'shared']
};
```

## Size Limits (KB)

- foundation: 6
- shared: 4
- events: 5
- templates: 7
- components: 8
- state: 6
- routing: 6
- cache: 5
- scheduling: 3
- a11y: 4
- plugins: 4

## Quality Checklist

- [ ] Structure matches template
- [ ] Dependencies follow graph
- [ ] Size within budget
- [ ] 95% test coverage
- [ ] Documentation complete
- [ ] Examples working
- [ ] Linting passes
- [ ] Type checking clean