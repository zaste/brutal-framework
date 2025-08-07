# 🎯 BRUTAL V4: Pre-Phase 2 Master Plan

## Executive Summary

Critical architectural fixes required before migrating V3's performance layer. Based on expert review by emulating Alex Russell, Jake Archibald, Addy Osmani, Lea Verou, and Paul Lewis.

## 🚨 Critical Issues Identified

1. **No Render Scheduling** - Synchronous renders causing layout thrashing
2. **Memory Leaks** - Event listeners and state references not using WeakMaps
3. **Monolithic Modules** - Template.js (652 lines), PerformanceMonitor.js (741 lines)
4. **Debug Code in Production** - No build-time optimization
5. **Missing Worker Infrastructure** - V3 performance depends on workers

## 📅 4-Day Execution Plan

### Day 1: Core Performance Foundation (8h)

#### Morning (3h): RenderScheduler
```javascript
// Location: /core/scheduling/RenderScheduler.js
class RenderScheduler {
    - RAF-based render queue
    - Priority levels: USER_INPUT > ANIMATION > BACKGROUND
    - Automatic batching of component updates
    - Microtask fallback for synchronous needs
    - Integration hooks for Phase 2 DOMScheduler
}
```

#### Afternoon (5h): Memory + Modularization Start
```javascript
// Memory fixes in:
- Component.js: WeakMap for component states
- Events.js: WeakMap for listener registry
- State.js: WeakRef for subscriptions
- CoreIntegration.js: WeakMap for instances

// Template.js split into:
/core/templates/
├── html.js (~150 lines)
├── css.js (~100 lines)
├── cache.js (~100 lines)
├── directives.js (~200 lines)
├── interpolation.js (~100 lines)
└── index.js (exports)
```

### Day 2: Build System & Workers (8h)

#### Morning (3h): Complete Modularization
```javascript
// PerformanceMonitor.js split into:
/core/performance/
├── Monitor.js (~200 lines)
├── collectors/
│   ├── ComponentCollector.js
│   ├── MemoryCollector.js
│   ├── DOMCollector.js
│   └── NetworkCollector.js
├── observers/
│   └── PerformanceObserver.js
└── index.js
```

#### Afternoon (5h): Production Build + Worker Skeleton
```javascript
// Build configuration
/build/config.js
- Environment detection (__DEV__, __PROD__)
- Debug code stripping
- Tree-shaking boundaries
- Conditional imports

// Worker infrastructure
/workers/core/
├── WorkerManager.js
├── WorkerPool.js
├── WorkerMessage.js
└── WorkerProxy.js
```

### Day 3: Modern Standards (8h)

#### Morning (4h): Web Standards Integration
- **Constructable StyleSheets**
  - Update Component.js base class
  - Convert all 3 existing components
  - Integrate with DesignSystem.js

- **ElementInternals API**
  - Add to Component.js
  - Implement in Input.js
  - Prepare for form participation

#### Afternoon (4h): Advanced Features
- **Lazy Loading Boundaries**
  - Dynamic imports for features
  - Component-level splitting
  - Route-based preparation

- **SharedArrayBuffer Detection**
  - Feature detection
  - Fallback strategies
  
- **Async Component Lifecycle**
  - async connectedCallback
  - Promise-based initialization

### Day 4: Validation & Documentation (8h)

#### Morning (4h): Integration Testing
```javascript
// Create /validation/pre-phase2-validator.js
const validator = {
    checkRenderScheduling() {
        // Verify no synchronous renders
    },
    checkMemoryLeaks() {
        // Chrome DevTools heap analysis
    },
    checkBundleSize() {
        // Ensure core < 10KB
    },
    checkWorkerSpawn() {
        // Test worker creation
    }
};
```

#### Afternoon (4h): Documentation
- Architectural decisions document
- Migration guide for changes
- Performance impact analysis
- Phase 2 readiness checklist

## 🎯 Success Criteria

### Must Have (Blocking Phase 2)
- [ ] Zero synchronous renders
- [ ] Zero memory leaks
- [ ] All modules < 150 lines
- [ ] Core bundle < 10KB
- [ ] Workers can spawn
- [ ] Production build strips debug code

### Should Have (Quality)
- [ ] Constructable StyleSheets working
- [ ] ElementInternals implemented
- [ ] Lazy boundaries established
- [ ] SharedArrayBuffer detection
- [ ] Async lifecycle support

## 🧪 BRUTAL Test V4 Native Design (2 days after)

### Core Concept: Tests ARE Components
```javascript
class BrutalTest extends BrutalComponent {
    // Tests use same lifecycle
    // Same event system
    // Same state management
    // Same performance monitoring
}
```

### Architecture
```
/core/testing/
├── Test.js           // Base test component
├── TestRunner.js     // Runner component
├── TestAssertions.js // Assertion library
└── TestReporter.js   // Reporting component

/components/testing/
├── TestSuite.js      // Visual test suite
├── TestDashboard.js  // Live dashboard
└── TestFixSuggester.js // Fix suggestions
```

### Integration Points
- Uses BrutalEvents for communication
- Uses BrutalState for test state
- Uses BrutalPerformance for metrics
- Uses BrutalRegistry for discovery

## 📊 Risk Mitigation

### Critical Path Dependencies
1. RenderScheduler MUST be first
2. Memory fixes MUST be second
3. Module splitting enables other work
4. Worker skeleton blocks Phase 2

### Parallel Opportunities
- StyleSheets + ElementInternals
- Documentation during development
- Test design during implementation

### Fallback Plans
- Can extend timeline by 1 day if needed
- Test system is separate (can delay)
- Phase 2 can start with partial completion

## 🚀 Next Steps After Completion

1. **BRUTAL Test V4 Implementation** (2 days)
2. **Phase 2 Performance Migration** (5 days)
3. **Component Library Migration** (3 weeks)
4. **Advanced Features** (1 week)
5. **Final Testing & Polish** (1 week)

## 📋 Daily Standup Format

Each day report:
- Completed tasks
- Current blockers
- Memory/performance metrics
- Bundle size status
- Next day priorities

---

**Remember**: Each fix makes Phase 2 exponentially easier. No shortcuts!