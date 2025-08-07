# 🏗️ BRUTAL V5 - Architecture Document (Revised)

## Overview

BRUTAL V5 is a modular, zero-dependency web framework built on Web Standards. This document defines the complete architecture, incorporating all valuable capabilities from V2 spec, V3, and V4.

## Package Architecture

### Core Packages (35KB total)
Essential packages that form the foundation:

| Package | Size | Purpose | Dependencies |
|---------|------|---------|--------------|
| @brutal/foundation | 6KB | Polyfills, Registry, Config, Constants | None |
| @brutal/shared | 4KB | Common utilities | None |
| @brutal/events | 5KB | Event system | @brutal/shared |
| @brutal/templates | 7KB | Template engine | @brutal/shared |
| @brutal/components | 8KB | Component system | @brutal/foundation, @brutal/templates, @brutal/events |
| @brutal/state | 6KB | State management | @brutal/shared, @brutal/events |
| @brutal/routing | 6KB | SPA routing | @brutal/events, @brutal/shared |
| @brutal/cache | 5KB | Multi-level cache | @brutal/shared |
| @brutal/scheduling | 3KB | DOM scheduling | None |
| @brutal/a11y | 4KB | Accessibility | None |
| @brutal/plugins | 4KB | Plugin system | @brutal/events, @brutal/shared |

### Enhanced Packages (20KB total)
Advanced versions with more features:

| Package | Size | Enhances | Features |
|---------|------|----------|----------|
| @brutal/enhanced-components | 10KB | components | Async, Portal, Observed |
| @brutal/enhanced-state | 8KB | state | Time-travel, DevTools |
| @brutal/enhanced-routing | 7KB | routing | Guards, Transitions |

## Detailed Package Contents

### @brutal/foundation (6KB)
Core primitives and configuration:
```
├── polyfill-strategy.ts    # Feature detection & loading
├── registry.ts             # Component registry
├── config-loader.ts        # Config management
├── constants.ts            # Global constants (NEW)
└── env-profiles.ts         # Environment profiles (NEW)
```

### @brutal/shared (4KB)
Shared utilities across packages:
```
├── sanitizer/
│   ├── html.ts            # HTML sanitization
│   └── css.ts             # CSS sanitization
├── errors/
│   ├── error-handler.ts   # Error handling
│   ├── error-reporter.ts  # Sentry/OTel integration (NEW)
│   └── error-helpers.ts   # Stack formatting (NEW)
├── dom/
│   ├── query.ts          # Query helpers
│   ├── manipulation.ts   # DOM manipulation
│   └── helpers.ts        # createElement, etc (NEW)
├── utils/
│   ├── debounce.ts       # Debounce/throttle
│   ├── uuid.ts           # UUID generation
│   └── types.ts          # Runtime type checks (NEW)
└── types/
    └── common.ts         # Shared TypeScript types
```

### @brutal/events (5KB)
Complete event system:
```
├── event-emitter.ts      # Base emitter class (NEW)
├── event-bus.ts          # Global pub/sub
├── event-manager.ts      # DOM delegation
└── types.ts              # Event types
```

### @brutal/templates (7KB)
Template engine with caching:
```
├── engine.ts             # Tagged templates
├── directives.ts         # Directive system
├── parser.ts             # Template parser
├── expression-parser.ts  # Safe expression eval (NEW)
├── compiler.ts           # Template compiler
└── cache.ts              # Template cache (NEW)
```

### @brutal/components (8KB)
Component system with helpers:
```
├── base-component.ts     # Web Component base
├── lifecycle.ts          # Lifecycle management
├── error-boundary.ts     # Error isolation
├── hooks.ts              # Component hooks
└── helpers.ts            # define, upgrade, slots (NEW)
```

### @brutal/state (6KB)
Complete state management:
```
├── reactive-state.ts     # Proxy-based reactivity
├── computed.ts           # Computed properties
├── watchers.ts           # State watchers
├── shared-state.ts       # SAB + fallback (NEW)
├── float64-atomics.ts    # Atomic operations (NEW)
└── helpers.ts            # clone, merge, watch (NEW)
```

### @brutal/routing (6KB)
Enhanced routing system:
```
├── router.ts             # Main router
├── route-matcher.ts      # Route matching
├── history.ts            # History wrapper (NEW)
├── guards.ts             # Route guards
└── helpers.ts            # breadcrumbs, params (NEW)
```

### @brutal/cache (5KB)
Multi-level caching:
```
├── cache-manager.ts      # L1/L2/L3 orchestration
├── strategies/           # Cache strategies
│   ├── network-first.ts
│   ├── cache-first.ts
│   └── stale-while-revalidate.ts
├── l1-memory.ts          # Memory cache
├── l2-indexeddb.ts       # IndexedDB cache
├── l3-service-worker.ts  # SW cache
└── helpers.ts            # TTL, cleanup (ENHANCED)
```

### @brutal/scheduling (3KB)
DOM scheduling optimization:
```
├── render-scheduler.ts   # RAF batching
├── task-queue.ts         # Priority queue
└── idle-scheduler.ts     # Idle time tasks
```

### @brutal/a11y (4KB)
Accessibility features:
```
├── focus-visible.ts      # Focus polyfill
├── aria-helpers.ts       # ARIA utilities (NEW)
└── keyboard-nav.ts       # Keyboard system (NEW)
```

### @brutal/plugins (4KB)
Plugin system:
```
├── plugin-manager.ts     # Plugin registry
├── plugin-context.ts     # Isolated context (NEW)
└── helpers.ts            # Validation utils (NEW)
```

## Bundle Strategy (Updated)

### Predefined Bundles

1. **brutal-lite.js** (15KB)
   - Minimal for landing pages
   - foundation + shared + templates + components

2. **brutal-core.js** (35KB)
   - Full core for SPAs
   - All core packages

3. **brutal-enhanced.js** (55KB)
   - Core + enhanced packages
   - For complex applications

4. **brutal-ui.js** (85KB)
   - Enhanced + UI packages
   - Full component library

5. **brutal-full.js** (155KB)
   - Everything included
   - Enterprise applications

## Migration Notes

### New Modules Added from V2 Spec
1. Constants & EnvProfiles → `@brutal/foundation`
2. ExpressionParser & TemplateCache → `@brutal/templates`
3. EventEmitter → `@brutal/events`
4. ComponentHelpers → `@brutal/components`
5. StateHelpers, SharedState, Float64Atomics → `@brutal/state`
6. RouteHelpers & History → `@brutal/routing`
7. ErrorReporter & ErrorHelpers → `@brutal/shared/errors`
8. AriaHelpers & KeyboardNav → `@brutal/a11y`
9. PluginContext & Helpers → `@brutal/plugins`
10. DOM helpers & Types → `@brutal/shared`

### Size Impact
- Core increased from 30KB to 35KB (+5KB)
- Added functionality worth the size increase
- Still well under competitive frameworks

---

*This revised architecture incorporates all valuable capabilities while maintaining our core principles.*