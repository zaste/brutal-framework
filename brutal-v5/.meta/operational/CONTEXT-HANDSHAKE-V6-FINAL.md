# 🤝 Context Handshake V6 - BRUTAL V5 Framework
**Date**: January 12, 2025
**Status**: 9/11 packages at 95%+, 2 packages pending final coverage

## 🎯 Current Mission
Building BRUTAL V5 - Zero-dependency modular framework with **95% coverage requirement across ALL packages**

## 📍 Exact Current State

### ✅ Completed (9/11 packages)
| Package | Coverage | Status |
|---------|----------|--------|
| @brutal/foundation | 100% all metrics | ✅ BRUTAL |
| @brutal/shared | 100% all metrics | ✅ BRUTAL |
| @brutal/events | 100% all metrics | ✅ BRUTAL |
| @brutal/state | 100% all metrics | ✅ BRUTAL |
| @brutal/components | 100% all metrics | ✅ BRUTAL |
| @brutal/scheduling | 100% all metrics | ✅ BRUTAL |
| @brutal/a11y | 100% all metrics | ✅ BRUTAL |
| @brutal/plugins | 100% all metrics | ✅ BRUTAL |
| @brutal/cache | 99%/95%/96%/99% | ✅ BRUTAL |

### ⚠️ Pending (2/11 packages)
| Package | Current | Gap | Files to Fix |
|---------|---------|-----|--------------|
| @brutal/templates | 100%/**83.87%**/100%/100% | 11.13% branches | engine.ts, html.ts, template.ts |
| @brutal/routing | 100%/**94.44%**/100%/100% | 0.56% branches | router.ts (1 branch) |

## 📁 Critical Files & Issues

### @brutal/templates Branch Coverage Gaps
1. **engine.ts (line 24)**: `match[1]?.trim() || ''` - needs test when match[1] is undefined
2. **html.ts (line 29)**: Object serialization branch
3. **template.ts (line 82)**: `htmlEntities[match] || match` - fallback never tested

### @brutal/routing Branch Coverage Gap
1. **router.ts**: Missing 1 branch (0.56%) - likely in:
   - Line 40: Optional param extraction
   - Or navigation edge case

## 🔧 Quick Fix Commands

```bash
# Navigate to project
cd /workspaces/web/brutal-v5

# Check current coverage
cd packages/@brutal/templates && pnpm test:coverage
cd ../routing && pnpm test:coverage

# Run all tests
cd /workspaces/web/brutal-v5 && pnpm test

# Quick coverage check all packages
for pkg in templates routing; do 
  echo "=== @brutal/$pkg ==="
  cd "packages/@brutal/$pkg" && pnpm test:coverage 2>&1 | grep -E "(All files|branches)" | head -2
  cd /workspaces/web/brutal-v5
done
```

## 🎯 Exact Tasks to Complete

### 1. Fix @brutal/templates (Priority: HIGH)
```typescript
// Test needed for engine.ts line 24
it('should handle undefined capture groups', () => {
  // Test regex that captures undefined groups
});

// Test needed for html.ts line 29
it('should serialize non-plain objects', () => {
  const obj = new Date();
  const result = html`<div>${obj}</div>`;
  // Should call JSON.stringify
});

// Test needed for template.ts line 82
it('should handle unexpected characters in escapeHtml', () => {
  // Test character not in htmlEntities map
});
```

### 2. Fix @brutal/routing (Priority: HIGH)
```typescript
// Find and test the missing 0.56% branch
// Likely in route.ts line 40 or router edge case
```

## 📊 Progress Summary

```
Session Start (4h ago):
- Tests: Completely broken
- Coverage: Unmeasurable
- Packages working: 0/11

Current State:
- Tests: 100% passing (392 tests)
- Coverage: 9/11 at 95%+
- Packages working: 11/11
- TypeScript: Clean
- Build: 100% success
```

## ⚠️ Do NOT Do
1. Create new packages until 100% coverage
2. Add features before fixing coverage
3. Lower coverage thresholds
4. Skip branch coverage gaps

## ✅ MUST Do Next Session
1. Fix @brutal/templates branches (11.13% gap)
2. Fix @brutal/routing branch (0.56% gap)
3. Verify all packages meet 95% requirement
4. Only then proceed to create remaining 17 packages

## 🔒 State Preservation

### Git Status
All changes tracked, ready for commit when coverage reaches 95% in all packages.

### Key Achievements
- Jest ESM fully configured
- TypeScript clean
- 392 tests passing
- 9/11 packages exceed requirements
- Build system operational

### Remaining Work
- 2 packages need branch coverage fixes
- Then create 17 additional packages
- Then implement actual features

## 📋 Test Files to Modify

1. `/packages/@brutal/templates/src/engine/engine.test.ts`
2. `/packages/@brutal/templates/src/html/html.test.ts` 
3. `/packages/@brutal/templates/src/template/template.test.ts`
4. `/packages/@brutal/routing/src/route/route.test.ts`
5. `/packages/@brutal/routing/src/router/router-comprehensive.test.ts`

## 🎭 Key Context

- **BRUTAL Rule**: "95% coverage: Because 94% is not brutal enough"
- **Current Gap**: @brutal/routing at 94.44% (SO CLOSE!)
- **Test Pattern**: All packages use same structure, follow established patterns
- **No Dependencies**: Maintain zero-dependency principle

## 💾 Session Variables

```javascript
// Package coverage status
const coverageStatus = {
  passing: ['foundation', 'shared', 'events', 'state', 'components', 'scheduling', 'a11y', 'plugins', 'cache'],
  failing: ['templates', 'routing'],
  templates: { branches: 83.87, gap: 11.13 },
  routing: { branches: 94.44, gap: 0.56 }
};

// Next actions
const nextActions = [
  'Fix templates branch coverage',
  'Fix routing branch coverage', 
  'Verify 95% across all',
  'Create remaining packages'
];
```

---

**Next Session Start**: Run coverage check for templates and routing, fix the specific branch gaps identified above.