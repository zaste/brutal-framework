# 🎯 V6 Convergence Plan - The Essential 20%

**Date**: 2025-08-07  
**Goal**: Extract the 20% of features from V3-V5 that provide 80% of the value

## 📊 What V6 Should Absorb

### From V3 (Performance Patterns)
```javascript
// ✅ KEEP: RAF-based render batching
const renderQueue = new Set();
let scheduled = false;
function scheduleRender(component) {
  renderQueue.add(component);
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      renderQueue.forEach(c => c.render());
      renderQueue.clear();
      scheduled = false;
    });
  }
}

// ✅ KEEP: Fragment reuse pattern (simplified)
const fragmentCache = new Map();
function getFragment(html) {
  if (!fragmentCache.has(html)) {
    const template = document.createElement('template');
    template.innerHTML = html;
    fragmentCache.set(html, template.content);
  }
  return fragmentCache.get(html).cloneNode(true);
}
```

**Size**: ~1.5KB for essential performance patterns

### From V4 (Scheduling Wisdom)
```javascript
// ✅ KEEP: Priority queues (just 2 levels)
const urgent = new Set();
const normal = new Set();

function schedule(fn, priority = 'normal') {
  const queue = priority === 'urgent' ? urgent : normal;
  queue.add(fn);
  scheduleFlush();
}

// ❌ SKIP: Complex deadline scheduling
// ❌ SKIP: Worker pools
// ❌ SKIP: GPU features
```

**Size**: ~0.5KB for simple priority scheduling

### From V5 (Zero-Dependency Philosophy)
```javascript
// ✅ KEEP: Feature detection with fallback
const supportsConstructableStyleSheets = 
  'adoptedStyleSheets' in Document.prototype;

// ✅ KEEP: Pure ES modules approach
export { Component, html, render };  // No build step

// ❌ SKIP: Monorepo complexity
// ❌ SKIP: Package management overhead
```

**Size**: ~0.3KB for feature detection utilities

### From brutal-test (Minimal Testing)
```javascript
// ✅ KEEP: Simple assertions
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// ✅ KEEP: Component test harness
const mount = (component) => {
  document.body.appendChild(component);
  return () => document.body.removeChild(component);
};

// ❌ SKIP: Browser automation
// ❌ SKIP: Visual regression
```

**Size**: ~0.5KB for essential test utilities

## 🏗️ Recommended V6 Architecture

### Core Package Structure (8.5KB total)
```
@brutal/core (2.5KB)
├── Component class with Shadow DOM
├── Lifecycle management
└── Error boundaries

@brutal/state (1.5KB)
├── Proxy-based reactivity
├── Simple pub/sub
└── Batch updates

@brutal/dom (1KB)
├── Template literal rendering
├── Fragment caching
└── Efficient updates

@brutal/router (1KB)
├── Hash-based routing
├── Pattern matching
└── Lazy loading

@brutal/events (0.5KB)
├── Event delegation
└── Custom events

@brutal/scheduler (1KB)
├── RAF batching
├── Priority queues
└── Microtask flushing

@brutal/test (1KB)
├── Assertions
├── Component mounting
└── Performance utils
```

## 📝 Implementation Priority

### Phase 1: Complete Core Features (Current)
- [x] @brutal/core - Basic composition
- [x] @brutal/dom - Template rendering
- [x] @brutal/state - State management

### Phase 2: Add V3/V4 Performance (Next)
- [ ] RAF-based render scheduling
- [ ] Fragment caching
- [ ] Priority queues

### Phase 3: Essential Infrastructure
- [ ] @brutal/router - Hash routing
- [ ] @brutal/events - Event delegation
- [ ] @brutal/test - Minimal testing

### Phase 4: Optimization
- [ ] Monomorphic methods
- [ ] Constructable StyleSheets
- [ ] Dead code elimination

## 🚫 What NOT to Include

### Complexity to Avoid
- ❌ Virtual DOM
- ❌ Complex diffing algorithms
- ❌ Time travel debugging
- ❌ Plugin systems
- ❌ Build tooling requirements
- ❌ TypeScript (runtime overhead)

### Features Beyond 80/20
- ❌ Server-side rendering
- ❌ Hydration
- ❌ Suspense/concurrent features
- ❌ Portal/teleport
- ❌ Transition system

## 💡 Key Insights

1. **V3's performance patterns work** - RAF batching and fragment caching provide huge gains for minimal size
2. **V4's scheduling is overkill** - Two priority levels cover 95% of use cases
3. **V5's zero-dependency approach is right** - But monorepo structure isn't needed for 8.5KB
4. **brutal-test shows testing can be simple** - 10 lines of test utilities cover most needs

## 🎯 Success Criteria

V6 succeeds if it can:
- ✅ Build a TODO app in < 50 lines
- ✅ Build a SPA with routing in < 100 lines
- ✅ Render 10K components in < 100ms
- ✅ Total bundle < 8.5KB
- ✅ Zero runtime dependencies
- ✅ Works in all modern browsers

The key is ruthless prioritization: include only what developers use every day, implemented in the simplest possible way.