# 📝 BRUTAL V5 - Architecture Changes

## Changes Made

### 1. Size Adjustments
- **Core Total**: 30KB → 35KB (+5KB)
- Justified by adding 21 missing capabilities
- Still far below React (45KB) or Vue (34KB)

### 2. Package Size Updates
| Package | Old Size | New Size | Reason |
|---------|----------|----------|---------|
| @brutal/foundation | 5KB | 6KB | +Constants, EnvProfiles |
| @brutal/shared | 3KB | 4KB | +ErrorReporter, Helpers, DOM, Types |
| @brutal/templates | 6KB | 7KB | +ExpressionParser, TemplateCache |
| @brutal/a11y | 3KB | 4KB | +AriaHelpers, KeyboardNav |

### 3. New Modules Added

#### @brutal/foundation
- `constants.ts` - Global constants (events, routes, etc)
- `env-profiles.ts` - Dev/staging/prod configuration

#### @brutal/shared
- `errors/error-reporter.ts` - Sentry/OpenTelemetry integration
- `errors/error-helpers.ts` - Stack trace formatting
- `dom/helpers.ts` - createElement, fragment utilities
- `utils/types.ts` - Runtime type checking

#### @brutal/events
- `event-emitter.ts` - Base class for event emitters

#### @brutal/templates
- `expression-parser.ts` - Safe expression evaluation
- `cache.ts` - Template compilation cache

#### @brutal/components
- `helpers.ts` - define, upgrade, slot utilities

#### @brutal/state
- `shared-state.ts` - SharedArrayBuffer with Map fallback
- `float64-atomics.ts` - Atomic operations for Float64
- `helpers.ts` - clone, merge, watch utilities

#### @brutal/routing
- `history.ts` - History API wrapper with hash fallback
- `helpers.ts` - breadcrumbs, parseParams utilities

#### @brutal/a11y
- `aria-helpers.ts` - ARIA attribute utilities
- `keyboard-nav.ts` - Keyboard navigation system

#### @brutal/plugins
- `plugin-context.ts` - Isolated execution context
- `helpers.ts` - Plugin validation utilities

## Questions for Consideration

### 1. Error Package Structure
Currently, error handling is split:
- ErrorGuard → might move to separate package?
- ErrorReporter → in shared/errors
- ErrorBoundary → in components

**Should we create @brutal/error package?** (6KB)

### 2. SharedArrayBuffer Support
Float64Atomics requires SharedArrayBuffer which needs:
- HTTPS
- Specific CORS headers
- Not available in all browsers

**Should this be in core or an extension?**

### 3. Template Caching
TemplateCache adds complexity but improves performance.

**Is the complexity worth it for core?**

## Principles Check ✅

1. **Zero Dependencies**: ✅ Maintained
2. **Modular Design**: ✅ Each module has clear purpose
3. **Performance First**: ✅ 35KB is still excellent
4. **Quality Enforced**: ✅ All new modules need 95% coverage
5. **Developer Experience**: ✅ More helpers = better DX

## Next Steps

1. Review and approve changes
2. Update BUNDLE-MAP.md with new sizes
3. Update STRUCTURE-CHECKLIST.md with new modules
4. Create migration guide for new modules

---

*All changes respect our core principles while adding valuable capabilities.*