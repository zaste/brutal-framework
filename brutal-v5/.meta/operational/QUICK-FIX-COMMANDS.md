# 🚀 Quick Fix Commands - V5

## Immediate Fixes When Resuming

### 1. Fix TypeScript Error
```bash
cd /workspaces/web/brutal-v5
# Edit: packages/@brutal/shared/src/sanitizer/sanitizer.ts
# Remove or use ALLOWED_TAGS and ALLOWED_ATTRS variables
pnpm type-check  # Verify fix
```

### 2. Fix Jest ESM (Complex)
```bash
# Update all jest.config.js files to:
export default {
  preset: '../../../jest.preset.mjs',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
};

# Add to package.json scripts:
"test": "NODE_OPTIONS='--experimental-vm-modules' jest"
```

### 3. Test One Package
```bash
cd packages/@brutal/foundation
pnpm test  # Should work after fixes
```

### 4. Check Coverage
```bash
pnpm test:coverage
# Should show actual percentages
```

## Build Commands
```bash
pnpm clean       # Clean all dist
pnpm install     # Install deps
pnpm build       # Build all
pnpm type-check  # Check types
pnpm lint        # Lint code
pnpm test        # Run tests
```

## Problem Packages
- @brutal/shared - TypeScript error
- @brutal/foundation - 2 failing tests
- @brutal/templates - Module resolution
- @brutal/cache - Module resolution
- @brutal/routing - Module resolution

## Size Check
```bash
# After size-limit installed:
pnpm size
# Cache is over limit (6.11KB > 5KB)
```