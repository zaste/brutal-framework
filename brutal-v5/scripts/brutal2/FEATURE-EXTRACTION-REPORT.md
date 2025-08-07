# 🎯 BRUTAL V5 → @brutal2 Feature Extraction Report
*Sin pérdida, sin ruido*

## 📊 What We're Keeping (The Signal)

### 1. **Templates** - Best of 7 implementations
```typescript
// KEEP: Ultra-minimal recursive parser (from minimal.ts)
const compile = (t) => new Function('d', `with(d)return\`${
  t.replace(/\${([^}]+)}/g, (_, e) => `\${${e}}`)
}\``);

// FEATURES TO PRESERVE:
- Expression interpolation: ${value}
- Conditional rendering: ${condition ? yes : no}
- Loop rendering: ${items.map(i => html`...`)}
- Event handling: @click=${handler}
- Property binding: .prop=${value}
- Attribute binding: attr=${value}
```

### 2. **Components** - Pure composition pattern
```typescript
// KEEP: Composition utilities (extract from inheritance mess)
const withState = (el) => {
  const state = new Proxy({}, {
    set(t, k, v) {
      t[k] = v;
      el.update?.();
      return true;
    }
  });
  el.state = state;
  return el;
};

// FEATURES TO PRESERVE:
- Reactive state via Proxy
- Lifecycle hooks (connected, disconnected)
- Automatic re-rendering
- Event handling
- Shadow DOM support (optional)
```

### 3. **State** - Reactive stores
```typescript
// KEEP: Proxy-based stores (from minimal.ts)
const createStore = (initial) => {
  const subs = new Set();
  return new Proxy(initial, {
    set(t, k, v) {
      t[k] = v;
      subs.forEach(fn => fn({[k]: v}));
      return true;
    }
  });
};

// FEATURES TO PRESERVE:
- Proxy-based reactivity
- Subscriptions
- Computed values
- Actions/mutations
- DevTools integration (optional)
```

### 4. **Events** - Unified system
```typescript
// KEEP: Minimal event emitter pattern
const events = (() => {
  const e = new Map();
  return {
    on: (k, h) => (e.get(k) || e.set(k, new Set()).get(k)).add(h),
    off: (k, h) => e.get(k)?.delete(h),
    emit: (k, d) => e.get(k)?.forEach(h => h(d))
  };
})();

// FEATURES TO PRESERVE:
- Global event bus
- Component events
- DOM event delegation
- Once listeners
- Wildcard events
```

### 5. **Router** - SPA navigation
```typescript
// KEEP: RegExp route compilation (from minimal.ts)
const router = (routes) => {
  const compiled = routes.map(r => ({
    ...r,
    regex: new RegExp(`^${r.path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`)
  }));
  // ... matching logic
};

// FEATURES TO PRESERVE:
- Path parameters
- Query strings
- Navigation guards
- History management
- Lazy loading
```

### 6. **Animation** - GPU-accelerated
```typescript
// KEEP: RAF-based animation loop (from minimal.ts)
const animate = (el, props, opts) => {
  const start = performance.now();
  const loop = (now) => {
    const p = Math.min((now - start) / opts.duration, 1);
    // Apply transforms...
    if (p < 1) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

// FEATURES TO PRESERVE:
- Transform animations
- Easing functions
- Promise-based API
- Timeline sequencing
- GPU acceleration
```

## 🗑️ What We're Discarding (The Noise)

### Templates
- ❌ 6 redundant implementations
- ❌ Complex AST builders
- ❌ Multiple parser strategies
- ❌ Unused directive systems

### Components
- ❌ Class inheritance patterns
- ❌ Multiple base classes
- ❌ Redundant lifecycle implementations
- ❌ Complex component registries

### State
- ❌ Redux-like patterns
- ❌ Multiple store implementations
- ❌ Complex middleware systems
- ❌ Unnecessary abstractions

## 📐 Size Analysis

### Current V5 (Noisy)
```
Package      Current   Minimal   Target
---------    -------   -------   ------
templates    7KB       2KB       1.5KB
components   9KB       3KB       2KB
state        3KB       1KB       1KB
events       16KB      -         1KB
router       2KB       1KB       1KB
animation    2.3KB     1KB       1KB
shared       13KB      -         1KB
---------    -------   -------   ------
TOTAL        52KB      8KB       8.5KB
```

### @brutal2 (Clean)
```
Package      Size    Features
---------    ----    --------
core         2KB     Composition, lifecycle, registry
dom          2KB     Templates, rendering
state        1KB     Stores, reactivity
events       1KB     Emitter, delegation
router       1KB     SPA, guards
animation    1KB     GPU, timeline
utils        0.5KB   Shared helpers
---------    ----
TOTAL        8.5KB   100% functionality
```

## 🎨 API Design Principles

### 1. **Natural JavaScript**
```typescript
// Not this
store.dispatch({ type: 'SET', payload: { name: 'John' } });

// But this
store.name = 'John';
```

### 2. **Function First**
```typescript
// Not this
class Button extends Component { }

// But this
const Button = component({ tag: 'button' });
```

### 3. **Minimal API Surface**
```typescript
// Complete component in 3 functions
const { html, component, render } = brutal2;
```

### 4. **Zero Magic**
- No build step required
- No babel plugins
- No webpack configs
- Just ES modules

## 🔧 Implementation Strategy

### Phase 1: Core (Day 1)
1. Extract composition utilities
2. Create lifecycle management
3. Build component factory
4. Test with basic components

### Phase 2: DOM (Day 1)
1. Port minimal template compiler
2. Add event handling
3. Implement efficient rendering
4. Test with complex templates

### Phase 3: State & Events (Day 2)
1. Extract Proxy-based store
2. Add subscription system
3. Create event emitter
4. Test reactivity

### Phase 4: Router & Animation (Day 3)
1. Port route compilation
2. Add history management
3. Extract animation loop
4. Test navigation & animations

### Phase 5: Polish (Day 4)
1. Optimize bundle size
2. Add TypeScript types
3. Create examples
4. Write migration guide

## 💡 Key Innovations to Preserve

1. **Ultra-minimal patterns** - Maximum functionality in minimum code
2. **Proxy-based APIs** - Natural JavaScript feel
3. **Compile-time optimization** - Templates to functions
4. **Zero dependencies** - No external packages
5. **Dual format** - Full (readable) + minimal (production)

## 🎯 Success Metrics

- ✅ Under 10KB total
- ✅ 100% feature parity with V5 core
- ✅ Zero breaking changes in core API
- ✅ 50%+ size reduction
- ✅ Better performance
- ✅ Cleaner codebase

---

**Conclusion**: We can extract 100% of the value from V5 while eliminating 80% of the code. The minimal implementations already show us the way - they are the signal we need to amplify.