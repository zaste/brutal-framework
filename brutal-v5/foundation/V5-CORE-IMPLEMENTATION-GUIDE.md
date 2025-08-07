# 📐 BRUTAL V5 - Core Implementation Guide

## Purpose
This document consolidates all V5 knowledge to guide implementation without randomness. It serves as the single source of truth for building V5.

## 🎯 Core Philosophy

### Principles
1. **Zero Dependencies** - No runtime dependencies, ever
2. **Modular Architecture** - True package independence
3. **Start Simple, Grow Smart** - YAGNI applies to structure
4. **Automation Over Discipline** - Tooling enforces quality
5. **Explicit Over Implicit** - No magic behavior

### Anti-Patterns to Avoid
- ❌ Deep nesting for organization sake
- ❌ Empty placeholder directories
- ❌ Duplicate configuration files
- ❌ Complex naming schemes
- ❌ Premature optimization

## 📦 Package Architecture

### Dependency Graph (Strict)
```
foundation (0 deps)
├── shared (0 deps)
├── events → shared
├── templates → shared
├── components → foundation, templates, events
├── state → shared, events
├── routing → events, shared
├── cache → shared
├── scheduling (0 deps)
├── a11y (0 deps)
└── plugins → events, shared
```

### Package Details

#### @brutal/foundation (6KB)
**Purpose**: Core primitives and configuration
```
├── polyfill-strategy.ts    # Feature detection & loading
├── registry.ts             # Component registry
├── config-loader.ts        # Config management
├── constants.ts            # Global constants
└── env-profiles.ts         # Environment profiles
```

#### @brutal/shared (4KB)
**Purpose**: Common utilities across packages
```
├── sanitizer/
│   ├── html.ts            # HTML sanitization
│   └── css.ts             # CSS sanitization
├── errors/
│   ├── error-handler.ts   # Error handling
│   ├── error-reporter.ts  # Monitoring integration
│   └── error-helpers.ts   # Stack formatting
├── dom/
│   ├── query.ts          # Query helpers
│   ├── manipulation.ts   # DOM manipulation
│   └── helpers.ts        # createElement, etc
├── utils/
│   ├── debounce.ts       # Debounce/throttle
│   ├── uuid.ts           # UUID generation
│   └── types.ts          # Runtime type checks
└── types/
    └── common.ts         # Shared TypeScript types
```

#### @brutal/events (5KB)
**Purpose**: Complete event system
```
├── event-emitter.ts      # Base emitter class
├── event-bus.ts          # Global pub/sub
├── event-manager.ts      # DOM delegation
└── types.ts              # Event types
```

#### @brutal/templates (7KB)
**Purpose**: Template engine with caching
```
├── engine.ts             # Tagged templates
├── directives.ts         # Directive system
├── parser.ts             # Template parser
├── expression-parser.ts  # Safe expression eval
├── compiler.ts           # Template compiler
└── cache.ts              # Template cache
```

#### @brutal/components (8KB)
**Purpose**: Component system with lifecycle management
```
├── base-component.ts     # Web Component base class
├── lifecycle.ts          # Lifecycle with WeakMap storage
│   ├── componentStates   # WeakMap for instance data
│   ├── componentCleanups # Cleanup registry
│   └── renderScheduler   # Integration with @brutal/scheduling
├── error-boundary.ts     # Error isolation & recovery
├── hooks.ts              # onMount, onUnmount, onUpdate
├── registry.ts           # Component registry & upgrades
└── helpers.ts            # define, upgrade, slots, adoptedCallback
```

**Key Implementation Details**:
- WeakMap storage prevents memory leaks
- Automatic cleanup on disconnectedCallback
- Render scheduling via requestIdleCallback
- Error boundaries prevent cascade failures

#### @brutal/state (6KB)
**Purpose**: Complete state management
```
├── reactive-state.ts     # Proxy-based reactivity
├── computed.ts           # Computed properties
├── watchers.ts           # State watchers
├── shared-state.ts       # SharedArrayBuffer + fallback
├── float64-atomics.ts    # Atomic operations
└── helpers.ts            # clone, merge, watch
```

#### @brutal/routing (6KB)
**Purpose**: SPA routing system
```
├── router.ts             # Main router
├── route-matcher.ts      # Route matching
├── history.ts            # History wrapper
├── guards.ts             # Route guards
└── helpers.ts            # breadcrumbs, params
```

#### @brutal/cache (5KB)
**Purpose**: Multi-level caching
```
├── cache-manager.ts      # L1/L2/L3 orchestration
├── strategies/           # Cache strategies
│   ├── network-first.ts
│   ├── cache-first.ts
│   └── stale-while-revalidate.ts
├── l1-memory.ts          # Memory cache
├── l2-indexeddb.ts       # IndexedDB cache
├── l3-service-worker.ts  # SW cache
└── helpers.ts            # TTL, cleanup
```

#### @brutal/scheduling (3KB)
**Purpose**: DOM scheduling optimization
```
├── render-scheduler.ts   # RAF batching
├── task-queue.ts         # Priority queue
└── idle-scheduler.ts     # Idle time tasks
```

#### @brutal/a11y (4KB)
**Purpose**: Accessibility features
```
├── focus-visible.ts      # Focus polyfill
├── aria-helpers.ts       # ARIA utilities
└── keyboard-nav.ts       # Keyboard system
```

#### @brutal/plugins (4KB)
**Purpose**: Plugin system
```
├── plugin-manager.ts     # Plugin registry
├── plugin-context.ts     # Isolated context
└── helpers.ts            # Validation utils
```

## 🗂️ Directory Structure

### Initial Structure (Minimal)
```
brutal-v5/
├── packages/                    # Core monorepo packages
│   ├── foundation/              # @brutal/foundation
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── index.test.ts   # Co-located tests
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── shared/                  # @brutal/shared
│   ├── events/                  # @brutal/events
│   ├── templates/               # @brutal/templates
│   ├── components/              # @brutal/components
│   ├── state/                   # @brutal/state
│   ├── routing/                 # @brutal/routing
│   ├── cache/                   # @brutal/cache
│   ├── scheduling/              # @brutal/scheduling
│   ├── a11y/                    # @brutal/a11y
│   └── plugins/                 # @brutal/plugins
│
├── examples/                    # Working examples
│   ├── basic/
│   └── advanced/
│
├── scripts/                     # Build & maintenance
│   ├── create-package.js
│   └── validate-structure.js
│
├── .github/                     # GitHub Actions
│   └── workflows/
│       └── ci.yml
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── .gitignore
├── LICENSE
├── README.md
└── CONTRIBUTING.md
```

### Growth Strategy
- Add `enhanced-*` packages when needed
- Add `tools/` when CLI is built
- Add `apps/` when playground is needed
- Never add empty directories

## 📊 Bundle Strategy

### Predefined Bundles
1. **brutal-lite.js** (15KB)
   - foundation + shared + templates + components (partial)
   - For landing pages

2. **brutal-core.js** (35KB)
   - All 11 core packages
   - For SPAs

3. **brutal-enhanced.js** (55KB)
   - Core + enhanced packages
   - For complex apps

4. **brutal-ui.js** (85KB)
   - Enhanced + UI components
   - Full component library

5. **brutal-full.js** (155KB)
   - Everything included
   - Enterprise applications

### Size Budgets (Enforced)
| Bundle | Max Size | Init Time |
|--------|----------|-----------|
| lite | 15KB | <50ms |
| core | 35KB | <300ms |
| enhanced | 55KB | <500ms |
| ui | 85KB | <700ms |
| full | 155KB | <1000ms |

## ✅ Quality Standards

### Required for Every Package
1. **Structure**: Exact same structure
2. **Tests**: 95% coverage minimum
3. **Types**: 100% TypeScript coverage
4. **Docs**: README, API, EXAMPLES
5. **Size**: Within budget
6. **Performance**: Meets benchmarks

### Automation
```yaml
# Every PR must pass
- lint: ESLint with security plugin
- format: Prettier
- types: TypeScript strict
- tests: Jest with coverage
- size: Bundle size check
- perf: Performance benchmarks
- security: Dependency audit
```

## 🔄 Implementation Order

### Current Focus: Foundation Setup
1. Setup monorepo tooling
2. Create foundation package
3. Validate all automation works
4. First PR passes all gates

### Core Package Implementation Order
Order matters due to dependencies:
1. `shared` (no deps)
2. `events` (needs shared)
3. `templates` (needs shared)
4. `components` (needs foundation, templates, events)
5. `state` (needs shared, events)
6. `routing` (needs events, shared)
7. `cache` (needs shared)
8. `scheduling` (no deps)
9. `a11y` (no deps)
10. `plugins` (needs events, shared)

### Enhanced Package Set
After core packages are stable:
1. `enhanced-components`
2. `enhanced-state`
3. `enhanced-routing`

### Extension Packages
Based on community needs and feedback

## 🚫 Common Mistakes to Avoid

1. **Creating package without all required files**
   - Use `scripts/create-package.js`

2. **Incorrect dependency relationships**
   - Follow dependency graph exactly

3. **Missing configuration files**
   - Extend from root configs

4. **Wrong file naming convention**
   - Source: `kebab-case.ts`
   - Tests: `[name].test.ts`

5. **Circular dependencies**
   - Validated by `scripts/validate-structure.js`

6. **Breaking size budgets**
   - Checked in CI/CD

## 📋 Validation Checklist

Before any implementation:
- [ ] Package follows exact structure
- [ ] Dependencies match graph
- [ ] All configs extend root
- [ ] Tests are co-located
- [ ] Size within budget
- [ ] No circular dependencies
- [ ] Documentation complete

## 🎯 Success Criteria

1. **Zero "figure it out later"**
2. **Zero undocumented decisions**
3. **Zero quality compromises**
4. **Zero dependency creep**
5. **Zero architecture drift**

---

*This guide removes all randomness from V5 implementation. Follow it exactly.*