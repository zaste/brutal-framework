# 📋 BRUTAL V5 - Structure Creation Checklist

## Pre-Creation Validation

Before creating ANY folder or file, verify:

### 1. Package Structure Template
Every package MUST have:
```
packages/@brutal/[name]/
├── src/
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── performance/
├── types/
│   └── index.d.ts
├── docs/
│   ├── README.md
│   ├── API.md
│   └── EXAMPLES.md
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── CHANGELOG.md
```

### 2. Package Dependencies
Verify dependency graph is correct:
- foundation → no dependencies
- shared → no dependencies
- events → shared
- templates → shared
- components → foundation, templates, events
- state → shared, events
- routing → events, shared
- cache → shared
- scheduling → no dependencies
- a11y → no dependencies
- plugins → events, shared

### 3. File Naming Conventions
- **Source files**: kebab-case.ts
- **Test files**: [name].test.ts
- **Type files**: [name].d.ts
- **Config files**: [tool].config.js
- **Docs**: UPPER-CASE.md

### 4. Package.json Template
```json
{
  "name": "@brutal/[name]",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "types"],
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {},
  "peerDependencies": {}
}
```

## Creation Order

### Phase 1: Root Structure
```bash
# 1. Root configuration files
pnpm-workspace.yaml
tsconfig.base.json
jest.config.base.js
.eslintrc.base.js
.prettierrc
.gitignore
.npmrc
.nvmrc

# 2. Root package.json
package.json (workspace root)

# 3. Documentation
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
```

### Phase 2: Core Packages (Order Matters!)
1. `packages/@brutal/foundation/`
2. `packages/@brutal/shared/`
3. `packages/@brutal/events/`
4. `packages/@brutal/templates/`
5. `packages/@brutal/components/`
6. `packages/@brutal/state/`
7. `packages/@brutal/routing/`
8. `packages/@brutal/cache/`
9. `packages/@brutal/scheduling/`
10. `packages/@brutal/a11y/`
11. `packages/@brutal/plugins/`

### Phase 3: Enhanced Packages
1. `packages/@brutal/enhanced-components/`
2. `packages/@brutal/enhanced-state/`
3. `packages/@brutal/enhanced-routing/`

### Phase 4: Extension Packages
1. `packages/@brutal/testing/`
2. `packages/@brutal/forms/`
3. `packages/@brutal/ui-primitives/`
4. `packages/@brutal/performance/`
5. `packages/@brutal/gpu/`
6. `packages/@brutal/animation/`
7. `packages/@brutal/mobile/`
8. `packages/@brutal/workers/`
9. `packages/@brutal/data/`
10. `packages/@brutal/pwa/`
11. `packages/@brutal/i18n/`
12. `packages/@brutal/security/`
13. `packages/@brutal/debug/`
14. `packages/@brutal/ai/`

### Phase 5: Tools & Apps
1. `tools/@brutal/cli/`
2. `tools/@brutal/build-plugins/`
3. `tools/@brutal/devtools/`
4. `apps/playground/`
5. `apps/docs/`
6. `apps/benchmark-runner/`

### Phase 6: Supporting Directories
1. `examples/`
2. `benchmarks/`
3. `community/`
4. `scripts/`
5. `config/`
6. `.github/workflows/`

## Validation Commands

After creating structure, run:

```bash
# 1. Verify workspace
pnpm install

# 2. Check all packages are recognized
pnpm ls --depth 0

# 3. Verify builds work
pnpm -r build

# 4. Check circular dependencies
pnpm why --recursive

# 5. Validate structure
node scripts/validate-structure.js
```

## Common Mistakes to Avoid

1. ❌ Creating package without all required directories
2. ❌ Incorrect dependency relationships
3. ❌ Missing configuration files
4. ❌ Wrong file naming convention
5. ❌ Circular dependencies
6. ❌ Package.json missing required fields
7. ❌ Forgetting workspace protocol in dependencies
8. ❌ Not following creation order

## Success Criteria

- [ ] All packages have identical structure
- [ ] No circular dependencies
- [ ] All configs extend base configs
- [ ] Workspace commands work
- [ ] Each package builds independently
- [ ] Dependencies follow architecture

## Automation Script

Create `scripts/create-package.js`:
```javascript
#!/usr/bin/env node
const name = process.argv[2];
if (!name) {
  console.error('Usage: create-package <name>');
  process.exit(1);
}

// Create all required directories and files
// Following the template exactly
```

---

*Follow this checklist exactly. No shortcuts. No deviations.*