# 🎯 BRUTAL V5 - Purification Execution Plan
*Zero-Error Strategy with Checkpoints and Validation*

## 📋 Pre-Purification Checklist

### 1. Backup & Safety
- [ ] Create git branch: `purification-v5`
- [ ] Full backup of current `/packages`
- [ ] Document current bundle sizes
- [ ] Export current test results
- [ ] Create rollback script

### 2. Analysis & Documentation
- [ ] Map ALL imports/exports relationships
- [ ] Identify ALL consumers of each export
- [ ] Document current API surface
- [ ] List all breaking changes
- [ ] Create feature preservation matrix

### 3. Validation Setup
- [ ] Create test suite for API compatibility
- [ ] Setup bundle size monitoring
- [ ] Create dependency validation script
- [ ] Setup integration tests

## 🗺️ Detailed Execution Plan

### Phase 0: Preparation (Day 1)
**Goal**: Zero surprises

#### 0.1 Create Safety Net
```bash
# Create working branch
git checkout -b purification-v5

# Backup current state
cp -r packages packages.backup

# Create rollback script
cat > rollback.sh << 'EOF'
#!/bin/bash
rm -rf packages
cp -r packages.backup packages
git checkout main
EOF
chmod +x rollback.sh
```

#### 0.2 Document Current State
```typescript
// scripts/document-current-state.js
const packages = ['foundation', 'shared', 'events', ...];
for (const pkg of packages) {
  // Document exports
  const exports = analyzeExports(`packages/@brutal/${pkg}`);
  
  // Document consumers
  const consumers = findConsumers(pkg);
  
  // Document bundle size
  const size = getBundleSize(pkg);
  
  saveToFile(`docs/current-state/${pkg}.json`, {
    exports,
    consumers,
    size,
    dependencies: getDependencies(pkg)
  });
}
```

#### 0.3 Create Validation Tests
```typescript
// scripts/validate-api-compatibility.js
export function validatePackageAPI(pkgName: string) {
  const before = require(`./current-state/${pkgName}.json`);
  const after = analyzeExports(`packages/@brutal/${pkgName}`);
  
  // Ensure all exports still exist
  for (const exp of before.exports) {
    if (!after.exports.includes(exp)) {
      throw new Error(`Missing export: ${exp}`);
    }
  }
}
```

### Phase 1: Shared Package Enhancement (Day 2)
**Goal**: Add composition utilities WITHOUT breaking existing exports

#### 1.1 Analyze Current Shared
```bash
# Check what shared currently exports
npm run analyze:exports @brutal/shared

# Find all imports of shared
grep -r "from '@brutal/shared" packages/
```

#### 1.2 Add Composition Utilities
```typescript
// packages/@brutal/shared/src/composition/index.ts
export const compose = (...fns) => (x) => 
  fns.reduceRight((v, f) => f(v), x);

export const withState = (element) => {
  const state = new Map();
  element.setState = (k, v) => {
    state.set(k, v);
    element.dispatchEvent(new CustomEvent('statechange'));
  };
  element.getState = (k) => state.get(k);
  return element;
};

// More composition utilities...
```

#### 1.3 Update Exports (APPEND ONLY)
```typescript
// packages/@brutal/shared/src/index.ts
// Existing exports
export * from './dom/index.js';
export * from './utils/index.js';

// NEW exports (append)
export * from './composition/index.js';  // ✅ Safe addition
```

#### 1.4 Validate
```bash
# Run validation
npm run validate:api @brutal/shared

# Check bundle size
npm run size @brutal/shared

# Run tests
npm test @brutal/shared
```

### Phase 2: Package-by-Package Purification (Days 3-7)

#### 2.1 Templates Package (Day 3)
**Risk**: Most redundancy, highest risk

##### Step 1: Feature Extraction Matrix
```typescript
// scripts/extract-template-features.js
const features = {
  'ultra-minimal.ts': {
    compile: true,
    render: true,
    expressions: true,
    loops: true,
    conditionals: true,
    filters: false,
    cache: false
  },
  'minimal.ts': {
    compile: true,
    render: true,
    expressions: true,
    loops: true,
    conditionals: true,
    filters: true,
    cache: false
  },
  'compiler/': {
    // ... analyze all features
  }
};
```

##### Step 2: Merge Features
```typescript
// packages/@brutal/templates/src/index.new.ts
// Combine ALL features from all implementations
import { parseExpression } from './old/core/parser.js';
import { cache } from './old/engine/cache.js';
import { filters } from './old/minimal.js';

export function compile(template: string, options?: CompileOptions) {
  // Merged implementation with ALL features
}
```

##### Step 3: Create Minimal
```typescript
// packages/@brutal/templates/src/minimal.new.ts
// Only core features for size
export const c = (t: string) => {
  // Ultra-compact implementation
};
```

##### Step 4: Safe Replacement
```bash
# Rename files (keep old ones)
mv src/index.ts src/index.old.ts
mv src/index.new.ts src/index.ts

# Test thoroughly
npm test @brutal/templates

# Check consumers still work
npm run test:integration

# If all good, delete old files
rm -rf src/compiler src/core src/engine
rm src/index.old.ts src/minimal.old.ts
```

#### 2.2 Components Package (Day 4-5)
**Risk**: Breaking change from inheritance to composition

##### Step 1: Create Compatibility Layer
```typescript
// packages/@brutal/components/src/compat.ts
// Temporary compatibility for inheritance pattern
export class Component extends HTMLElement {
  constructor() {
    super();
    console.warn('Component class is deprecated. Use createComponent()');
    // Wrap old API with new implementation
  }
}
```

##### Step 2: Implement Composition Pattern
```typescript
// packages/@brutal/components/src/index.ts
import { compose, withState, withEvents } from '@brutal/shared';

export function createComponent(config: ComponentConfig) {
  const element = document.createElement(config.tag || 'div');
  
  // Apply behaviors
  return compose(
    ...config.behaviors,
    withState,
    withEvents
  )(element);
}

// Keep old exports for compatibility
export { Component } from './compat.js';
```

##### Step 3: Test Migration Path
```typescript
// Test both patterns work
const oldWay = new Component();
const newWay = createComponent({ tag: 'my-component' });
```

#### 2.3 State Package (Day 6)
**Risk**: Dependency violations

##### Fix Dependencies First
```json
// packages/@brutal/state/package.json
{
  "dependencies": {
    "@brutal/shared": "workspace:*",
    "@brutal/events": "workspace:*"
  }
}
```

##### Consolidate Implementations
```bash
# Analyze differences
diff src/store/store.ts src/store/core.ts

# Merge best features into index.ts
# Delete redundant files
rm src/store/core.ts
```

### Phase 3: Validation & Testing (Day 8)

#### 3.1 Comprehensive Testing
```bash
# Run all tests
npm test

# Check bundle sizes
npm run size:all

# Validate dependencies
npm run validate:deps

# Integration tests
npm run test:integration

# Performance benchmarks
npm run bench
```

#### 3.2 Create Migration Guide
```markdown
# Migration Guide

## Breaking Changes
1. Components now use composition pattern
   - Old: `class MyComponent extends Component`
   - New: `createComponent({ behaviors: [...] })`

## Deprecations
1. `BrutalComponent` - Use `createComponent()`
2. Direct imports from subdirectories

## New Features
1. Composition utilities in @brutal/shared
2. Minimal exports for all packages
```

### Phase 4: Cleanup & Documentation (Day 9)

#### 4.1 Final Cleanup
```bash
# Delete backup if everything works
rm -rf packages.backup

# Remove old compatibility layers
# Update all examples
# Clean up test files
```

#### 4.2 Update Documentation
- Update README files
- Update API documentation
- Create architecture diagrams
- Update contribution guidelines

## 🚨 Error Prevention Strategies

### 1. Checkpoint System
After each major change:
```bash
# Create checkpoint
git add -A && git commit -m "checkpoint: [description]"

# Test checkpoint
npm run validate:all

# If fails, rollback
git reset --hard HEAD~1
```

### 2. Continuous Validation
```typescript
// scripts/watch-validation.js
watch('packages/**/*.ts', () => {
  validateAPIs();
  checkBundleSizes();
  runTests();
});
```

### 3. Feature Flags
```typescript
// During migration
export const ENABLE_COMPOSITION = process.env.BRUTAL_COMPOSITION || false;

export const createComponent = ENABLE_COMPOSITION 
  ? compositionImplementation 
  : legacyImplementation;
```

## 📊 Success Metrics

### Must Pass:
- [ ] All existing tests pass
- [ ] Bundle sizes within limits
- [ ] No breaking changes without compatibility
- [ ] Dependencies follow graph
- [ ] Zero runtime dependencies

### Quality Gates:
- [ ] Code coverage > 95%
- [ ] Performance benchmarks ± 5%
- [ ] API compatibility 100%
- [ ] Documentation complete

## 🔄 Rollback Plan

If anything goes wrong:
```bash
# Immediate rollback
./rollback.sh

# Or git rollback
git reset --hard [last-good-commit]

# Or partial rollback
git checkout main -- packages/@brutal/[problem-package]
```

## 📅 Timeline Summary

- **Day 1**: Preparation & safety setup
- **Day 2**: Enhance @brutal/shared
- **Day 3**: Purify templates
- **Day 4-5**: Transform components
- **Day 6**: Fix state & routing
- **Day 7**: Other packages
- **Day 8**: Validation & testing
- **Day 9**: Documentation & cleanup

## 🎯 Key Principles

1. **Never delete before validating replacement**
2. **Always maintain API compatibility**
3. **Test after every change**
4. **Commit at every checkpoint**
5. **Document all decisions**

This plan ensures zero-error execution through careful validation at every step!