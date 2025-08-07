# 🚨 Critical Fixes Action Plan - V5

## Current State Summary

**Build**: ✅ Working (all 11 packages compile)
**TypeScript**: ❌ 1 error in components (fixed, needs verification)
**Tests**: ❌ Multiple failures (ESM config issues)
**Size**: ⚠️ Cache package exceeds limit (6.11KB > 5KB)
**Coverage**: ❌ Unknown (tests not running properly)

## 🔴 P0 - Critical Blockers (Must fix before any new work)

### 1. Fix TypeScript Error in Components ✅
- **Status**: Fixed (changed `error-boundary` to `errorBoundary`)
- **Action**: Verify fix with `pnpm run type-check`

### 2. Fix Jest ESM Configuration
- **Issue**: Module resolution errors in tests
- **Symptoms**: "Cannot find module" errors
- **Root Cause**: Jest not properly configured for ESM + TypeScript
- **Actions**:
  1. Update jest.config.js files to use NODE_OPTIONS
  2. Add proper module resolution for .js extensions
  3. Configure ts-jest for ESM properly

### 3. Fix Failing Tests
- **Foundation**: 2 tests failing (registry)
- **Templates**: Module resolution errors
- **Cache**: Module resolution errors
- **Routing**: Module resolution errors

### 4. Size Limit Enforcement
- **Cache**: Reduce from 6.11KB to under 5KB
- **Action**: Install size-limit dependencies
- **Configure**: Proper CI gates

## 🟡 P1 - High Priority (After P0)

### 1. Test Coverage
- **Current**: Unknown (tests not running)
- **Target**: 95% all metrics
- **Focus**: Branch coverage (likely < 60%)

### 2. Missing Core Packages
- @brutal/performance
- @brutal/workers
- @brutal/security
- @brutal/testing

### 3. Deprecated Dependencies
- eslint@8.57.1 → latest
- Other outdated packages

## 🔧 Immediate Actions (Next 2 hours)

### Step 1: Verify TypeScript Fix
```bash
pnpm run type-check
```

### Step 2: Fix Jest Configuration
1. Update config/jest.preset.js for proper ESM
2. Add NODE_OPTIONS to package.json scripts
3. Fix module resolution

### Step 3: Run Clean Build
```bash
pnpm clean && pnpm install && pnpm build
```

### Step 4: Fix Tests One by One
- Start with foundation (core package)
- Then shared, events, state
- Finally routing, templates, cache

### Step 5: Check Coverage
```bash
pnpm test:coverage
```

## 📊 Success Criteria

Before moving to ANY new development:
- [ ] All TypeScript checks pass
- [ ] All tests pass (100% success)
- [ ] Test coverage > 95% (all metrics)
- [ ] All packages under size limit
- [ ] Zero build warnings
- [ ] Zero deprecated dependencies

## ⚠️ Do NOT:
- Create new packages until tests work
- Add new features until coverage met
- Ignore warnings or errors
- Skip any quality gates

## 📈 Progress Tracking

| Task | Status | Blocker |
|------|--------|---------|
| TypeScript | 🟡 Fixed, needs verify | - |
| Jest Config | 🔴 Broken | ESM issues |
| Test Execution | 🔴 Failing | Module resolution |
| Coverage | 🔴 Unknown | Tests not running |
| Size Limits | 🟡 Not enforced | Missing deps |

## 🎯 Definition of Done

V5 is ready for new development when:
1. `pnpm test` runs without errors
2. Coverage report shows > 95% all metrics
3. `pnpm run ci` passes all checks
4. No manual interventions needed