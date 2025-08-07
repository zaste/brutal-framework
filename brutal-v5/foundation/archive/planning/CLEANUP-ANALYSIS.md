# 🧹 BRUTAL V5 - Cleanup Analysis

## Current State of Our Workspace

### 1. V3 (framework-v3/)
**Status**: Monolithic, 300+ capabilities, ~800KB
**What doesn't fit V5**:
- ❌ All the numbered folders (01-core, 02-performance, etc.) - monolithic structure
- ❌ All the test-*.html files scattered in root (30+ files)
- ❌ All the build/analysis scripts in root (20+ files)
- ❌ GPU/WebGL code mixed with core
- ❌ AI/Builders mixed with core
- ❌ No package separation

**What we can salvage**:
- ✅ Performance gems (StyleManager, FragmentPool, etc.)
- ✅ Component implementations
- ✅ Test logic (needs reorganization)

### 2. V4 (brutal-v4/)
**Status**: Better architecture, 100% complete core
**What doesn't fit V5**:
- ❌ Duplicate folders (a11y vs accessibility)
- ❌ Test files scattered everywhere
- ❌ HTML test files in root
- ❌ No monorepo structure
- ❌ Components mixed with core

**What we can reuse**:
- ✅ Core implementations (mostly complete)
- ✅ Component system
- ✅ Testing infrastructure
- ✅ Worker system

### 3. V5 (brutal-v5/)
**Status**: Documentation only, no code yet
**Current structure**:
```
brutal-v5/
├── scripts/
│   └── validate-structure.js    # ✅ Fits
├── *.md files                   # ✅ All documentation fits
```

## What Needs Cleaning

### In V3:
1. **Test Files**: 50+ HTML test files in root
   - Should be: `packages/*/tests/` or `examples/`
   
2. **Build Scripts**: 20+ JS scripts in root
   - Should be: `scripts/` or package-specific

3. **Monolithic Structure**: Everything in numbered folders
   - Should be: Independent packages

### In V4:
1. **Test Files**: Scattered test.html files
   - Should be: Co-located with packages

2. **Duplicate Paths**: 
   - `core/a11y/` AND `core/accessibility/`
   - `core/base/` AND `core/foundation/`
   
3. **No Package Structure**: Everything under core/
   - Should be: `packages/*/`

## Recommended Approach

### Phase 1: Document What We'll Migrate
Create migration maps for each valuable piece:
```
V4: core/state/State.js → V5: packages/state/src/State.js
V4: core/routing/Router.js → V5: packages/routing/src/Router.js
```

### Phase 2: Start Fresh in V5
1. Create clean package structure
2. Copy only the needed code
3. Rewrite imports for monorepo
4. Add proper tests co-located

### Phase 3: Archive V3/V4
Once V5 is working:
- Move V3 → `archive/framework-v3/`
- Move V4 → `archive/brutal-v4/`
- Keep for reference only

## Items That Don't Fit Anywhere

### From V3:
- `brutal-repository-analysis.js` - One-time analysis script
- `check-syntax-*.js` - Temporary debugging scripts  
- `test-*.html` files - Should be examples or package tests
- `*-demo.html` files - Should be in examples/
- `benchmark-*.html` - Should be in benchmarks/

### From V4:
- `debug-imports.html` - Temporary debugging
- `simple-test.html` - Should be in examples/
- `validation/*.html` - Should be tests

## Clean V5 Vision

```
brutal-v5/
├── packages/           # Only production code
├── examples/          # Demo applications
├── scripts/           # Build tooling
├── benchmarks/        # Performance tests (when needed)
├── docs/              # Additional docs (when needed)
└── [config files]     # Root configs only
```

No test files in root. No temporary scripts. No debugging files.

### 4. brutal-test/
**Status**: Standalone test system with dependencies
**What doesn't fit V5**:
- ❌ Has dependencies (playwright, puppeteer, etc.)
- ❌ Standalone architecture
- ❌ Not integrated with V5 structure

**What we can salvage**:
- ✅ Test patterns and strategies
- ✅ Visual regression concepts
- ✅ Browser automation patterns
- ❓ Could become `@brutal/test` package (but needs zero-dep rewrite)

## Summary of Work Needed

### Existing Code That Fits V5 Structure:
- ✅ V5 documentation (all .md files)
- ✅ V5 validate-structure.js script

### Code That Needs Migration:
- 🔄 V4 core/* → V5 packages/*
- 🔄 V3 performance gems → V5 packages/performance
- 🔄 V3/V4 components → V5 packages/ui-primitives

### Code That Should Stay External:
- 📦 brutal-test → Could be separate tool or rewritten as @brutal/test

## Recommendation

**Current workspace is messy but salvageable:**

1. **V5 is clean** - Only docs and one script
2. **V4 has good code** - Needs repackaging
3. **V3 has gems** - Hidden in monolithic structure  
4. **brutal-test** - Useful but needs zero-dep rewrite

**Suggested approach:**
1. Keep V5 clean - don't copy anything directly
2. Create migration scripts to transform imports
3. Move code piece by piece with proper testing
4. Archive V3/V4 once V5 is complete

## Next Steps

1. **Make pending decisions** - SSR, telemetry, etc.
2. **Create V5 package structure** - Empty but correct
3. **Write migration scripts** - Transform V4 → V5
4. **Migrate incrementally** - Package by package
5. **Archive old versions** - Once V5 works

---

*Clean house, clean mind, clean code.*