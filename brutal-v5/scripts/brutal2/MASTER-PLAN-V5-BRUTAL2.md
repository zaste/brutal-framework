# 🎯 BRUTAL V5 + @brutal2 Master Plan
*Maximum planning, systematic execution, zero deviation*

## 📊 Current Situation Analysis

### V5 Status
- **Packages Implemented**: 11/11 core packages ✅
- **Current Size**: 71KB (target: 35KB) ❌
- **Redundancy Level**: Extreme (7 template implementations)
- **Architecture Issues**: Inheritance, dependency violations
- **Tooling**: Complete and operational ✅

### Key Discovery
- **Sin pérdida**: All features documented and mapped
- **Sin ruido**: 80% of code is redundant
- **Solution**: Clean implementation as @brutal2 within V5

## 🏗️ Master Architecture

```
brutal-v5/
├── packages/
│   ├── @brutal/          # Current packages (preserve for migration)
│   │   ├── foundation/   # ✅ Complete (6KB)
│   │   ├── shared/       # ❌ Needs purification
│   │   ├── events/       # ❌ Needs purification
│   │   └── ...          # All need purification
│   │
│   └── @brutal2/         # New clean implementation
│       ├── core/         # 2KB - Composition utilities
│       ├── dom/          # 2KB - Templates & rendering
│       ├── state/        # 1KB - Reactive stores
│       ├── events/       # 1KB - Event system
│       ├── router/       # 1KB - SPA routing
│       ├── animation/    # 1KB - GPU animations
│       └── utils/        # 0.5KB - Shared helpers
│
├── tools/                # ✅ Existing tooling (use for validation)
├── foundation/           # ✅ Architecture docs
└── scripts/
    └── brutal2/         # Planning & migration docs
```

## 📋 Execution Roadmap

### Phase 0: Setup & Alignment (Day 0 - TODAY)
**Goal**: Prepare infrastructure within V5 monorepo

1. **Create @brutal2 package structure**
   ```bash
   mkdir -p packages/@brutal2/{core,dom,state,events,router,animation,utils}
   ```

2. **Setup package.json for each**
   - Use V5 conventions
   - Zero runtime dependencies
   - Proper workspace references

3. **Configure build pipeline**
   - Extend tsup.config.base.js
   - Add to turbo.json
   - Setup size-limit tracking

4. **Create shared types**
   - Minimal type definitions
   - Cross-package interfaces

### Phase 1: Core Foundation (Day 1)
**Goal**: Implement composition system and DOM basics

#### Morning: @brutal2/core (2KB)
```typescript
// packages/@brutal2/core/src/index.ts
export const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
export const withState = (initial) => (el) => { /* Proxy-based state */ };
export const withEvents = (handlers) => (el) => { /* Event binding */ };
export const withLifecycle = (hooks) => (el) => { /* Lifecycle */ };
export const component = (config) => { /* Factory */ };
```

#### Afternoon: @brutal2/dom (2KB)
```typescript
// packages/@brutal2/dom/src/index.ts
export const html = (strings, ...values) => { /* Template compilation */ };
export const render = (template, container) => { /* Efficient updates */ };
export const delegate = (root, handlers) => { /* Event delegation */ };
```

### Phase 2: State & Events (Day 2)
**Goal**: Implement reactive state and event system

#### Morning: @brutal2/state (1KB)
```typescript
// packages/@brutal2/state/src/index.ts
export const store = (initial) => { /* Proxy-based store */ };
export const computed = (store, getters) => { /* Computed values */ };
```

#### Afternoon: @brutal2/events (1KB)
```typescript
// packages/@brutal2/events/src/index.ts
export const events = { on, off, emit, once };
```

### Phase 3: Router & Animation (Day 3)
**Goal**: Complete core feature set

#### Morning: @brutal2/router (1KB)
```typescript
// packages/@brutal2/router/src/index.ts
export const router = (routes) => { /* SPA routing */ };
```

#### Afternoon: @brutal2/animation (1KB)
```typescript
// packages/@brutal2/animation/src/index.ts
export const animate = (el, keyframes, options) => { /* RAF animations */ };
```

### Phase 4: Integration & Testing (Day 4)
**Goal**: Ensure everything works together

1. **@brutal2/utils** (0.5KB)
   - Shared helpers
   - Common patterns

2. **Integration tests**
   - Cross-package functionality
   - Real-world scenarios

3. **Performance validation**
   - Use V5 benchmark tools
   - Verify size budgets

4. **Documentation**
   - API reference
   - Migration guide

### Phase 5: Migration Strategy (Day 5)
**Goal**: Enable smooth transition

1. **Compatibility layer**
   - @brutal → @brutal2 adapters
   - Gradual migration path

2. **Codemods**
   - Automated transformations
   - Import updates

3. **Examples**
   - Side-by-side comparisons
   - Migration patterns

## 🛠️ Tooling Integration

### Use Existing V5 Tools
```bash
# Create packages
pnpm create:package @brutal2/core

# Build
pnpm build

# Test
pnpm test

# Size check
pnpm size

# Validate
node tools/performance/bundle-tracker.js
node tools/compatibility/version-validator.js
node tools/migration/breaking-change-analyzer.js
```

### Package Template
```json
{
  "name": "@brutal2/core",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "size": "size-limit"
  },
  "devDependencies": {
    "@brutal/tools": "workspace:*"
  },
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "2KB"
    }
  ]
}
```

### TSConfig
```json
{
  "extends": "../../../tsconfig.base.json",
  "include": ["src"],
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

## 📊 Success Metrics

### Size Targets
| Package | Dev | Prod | Actual |
|---------|-----|------|--------|
| core    | 3KB | 2KB  | TBD    |
| dom     | 3KB | 2KB  | TBD    |
| state   | 1.5KB | 1KB | TBD   |
| events  | 1.5KB | 1KB | TBD   |
| router  | 1.5KB | 1KB | TBD   |
| animation | 1.5KB | 1KB | TBD |
| utils   | 1KB | 0.5KB | TBD   |
| **TOTAL** | **14KB** | **8.5KB** | TBD |

### Quality Gates
- ✅ Zero runtime dependencies
- ✅ 100% test coverage
- ✅ TypeScript strict mode
- ✅ No circular dependencies
- ✅ Bundle size within limit
- ✅ Performance benchmarks pass

## 🔄 Migration Path

### Week 1: Parallel Development
- @brutal packages continue working
- @brutal2 packages developed alongside
- No breaking changes

### Week 2: Integration
- Compatibility layer ready
- Examples using both
- Documentation complete

### Week 3: Migration
- Codemods available
- Teams start migrating
- Support both versions

### Month 2: Deprecation
- @brutal marked deprecated
- All new work on @brutal2
- Migration support continues

### Month 3: Completion
- @brutal removed
- @brutal2 becomes @brutal v6
- Full transition complete

## 🚨 Risk Mitigation

### Technical Risks
1. **Size creep** → Daily size tracking
2. **API mismatch** → Compatibility tests
3. **Performance regression** → Benchmark suite
4. **Missing features** → Feature matrix tracking

### Process Risks
1. **Scope creep** → Strict feature list
2. **Timeline slip** → Daily progress checks
3. **Integration issues** → Continuous testing
4. **Adoption resistance** → Clear benefits docs

## 📝 Daily Checklist

### Each Day
- [ ] Review yesterday's progress
- [ ] Check size budgets
- [ ] Run test suite
- [ ] Update progress tracking
- [ ] Commit with clear messages
- [ ] Document any decisions

### Each Package
- [ ] Create structure
- [ ] Implement core functionality
- [ ] Write comprehensive tests
- [ ] Add TypeScript types
- [ ] Document API
- [ ] Validate with tools
- [ ] Check bundle size
- [ ] Benchmark performance

## 🎯 Final Deliverables

1. **7 packages** totaling 8.5KB
2. **100% feature parity** with V5
3. **Migration tools** and guides
4. **Performance improvements** documented
5. **Zero breaking changes** in core API

## 💡 Key Principles

1. **Systematic** - Follow the plan exactly
2. **Measured** - Track everything
3. **Clean** - No shortcuts or hacks
4. **Aligned** - Use V5 tooling throughout
5. **Documented** - Every decision recorded

---

**Ready to execute. The plan is complete, aligned, and systematic.**