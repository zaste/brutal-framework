# 🏗️ @brutal2 Final Architecture
*Sin pérdida, sin ruido - Pure signal*

## 🎯 Core Philosophy
- **Everything valuable from V5** (sin pérdida)
- **Zero redundancy** (sin ruido) 
- **Under 10KB** total
- **Natural JavaScript** (Proxy-based)
- **Pure functions** (no classes except Web Components)

## 📦 Package Structure

```
@brutal2/
├── core/         # 2KB - Foundation
│   ├── compose.js      # Composition utilities
│   ├── component.js    # Component factory
│   └── lifecycle.js    # Lifecycle management
│
├── dom/          # 2KB - Templates & Rendering
│   ├── compile.js      # Template compiler
│   ├── render.js       # DOM updates
│   └── events.js       # Event delegation
│
├── state/        # 1KB - Reactive State
│   ├── store.js        # Proxy stores
│   └── computed.js     # Computed values
│
├── events/       # 1KB - Event System
│   └── emitter.js      # Global bus + typed events
│
├── router/       # 1KB - SPA Routing
│   ├── matcher.js      # Route matching
│   └── history.js      # Navigation
│
├── animation/    # 1KB - GPU Animations
│   └── animate.js      # RAF-based system
│
└── utils/        # 0.5KB - Helpers
    └── index.js        # Shared utilities
```

## 🔧 Implementation Details

### Core Package
```typescript
// compose.js - Pure function composition
export const compose = (...fns) => x => 
  fns.reduceRight((v, f) => f(v), x);

// component.js - Factory pattern
export const component = (config) => {
  const el = document.createElement(config.tag || 'div');
  
  // Apply behaviors
  const enhanced = compose(
    ...config.behaviors || [],
    withLifecycle,
    withState,
    withRender
  )(el);
  
  // Define as custom element if name provided
  if (config.name) {
    customElements.define(config.name, class extends HTMLElement {
      constructor() {
        super();
        Object.assign(this, enhanced);
      }
    });
  }
  
  return enhanced;
};

// lifecycle.js - Standard Web Component hooks
export const withLifecycle = (el) => {
  el.connectedCallback = () => el.onMount?.();
  el.disconnectedCallback = () => el.onUnmount?.();
  el.attributeChangedCallback = (n, o, v) => el.onAttrChange?.(n, o, v);
  return el;
};
```

### DOM Package
```typescript
// compile.js - Ultra-minimal template compiler
export const html = (strings, ...values) => ({
  strings,
  values,
  // Compile to function for performance
  fn: compile(strings, values)
});

const compile = (strings, values) => {
  // Recursive descent parser in ~50 lines
  // Handles: ${expr}, @click=${fn}, .prop=${val}, ?attr=${bool}
  return (data) => {
    // Return compiled DOM nodes
  };
};

// render.js - Efficient DOM updates
export const render = (template, container) => {
  // Diff and patch algorithm
  // Reuse nodes when possible
  // Batch DOM updates
};

// events.js - Delegated event handling
export const delegate = (root, events) => {
  // Single listener per event type
  // Efficient event matching
};
```

### State Package
```typescript
// store.js - Reactive state management
export const store = (initial = {}) => {
  const subscribers = new Set();
  
  const proxy = new Proxy(initial, {
    set(target, key, value) {
      const old = target[key];
      target[key] = value;
      
      if (old !== value) {
        subscribers.forEach(fn => fn({ [key]: value }, key, old));
      }
      return true;
    },
    
    get(target, key) {
      if (key === 'subscribe') {
        return (fn) => {
          subscribers.add(fn);
          return () => subscribers.delete(fn);
        };
      }
      return target[key];
    }
  });
  
  return proxy;
};

// computed.js - Derived values
export const computed = (store, getters) => {
  const cache = {};
  const proxy = new Proxy({}, {
    get(_, key) {
      if (key in getters) {
        // Auto-track dependencies and cache
        return cache[key] || (cache[key] = getters[key](store));
      }
    }
  });
  
  // Invalidate cache on store changes
  store.subscribe(() => Object.keys(cache).forEach(k => delete cache[k]));
  
  return proxy;
};
```

### Events Package
```typescript
// emitter.js - Typed event system
export const events = () => {
  const handlers = new Map();
  
  return {
    on(event, handler) {
      const list = handlers.get(event) || new Set();
      list.add(handler);
      handlers.set(event, list);
      return () => list.delete(handler);
    },
    
    emit(event, data) {
      handlers.get(event)?.forEach(h => h(data));
      handlers.get('*')?.forEach(h => h(event, data)); // Wildcards
    },
    
    once(event, handler) {
      const off = this.on(event, (data) => {
        off();
        handler(data);
      });
      return off;
    }
  };
};
```

### Router Package
```typescript
// matcher.js - Efficient route matching
export const router = (routes) => {
  // Compile routes to RegExp
  const compiled = routes.map(route => ({
    ...route,
    regex: pathToRegex(route.path),
    params: extractParams(route.path)
  }));
  
  return {
    match(path) {
      for (const route of compiled) {
        const match = path.match(route.regex);
        if (match) {
          return {
            route,
            params: extractValues(match, route.params)
          };
        }
      }
    },
    
    navigate(path, options = {}) {
      history[options.replace ? 'replaceState' : 'pushState'](
        options.state,
        '',
        path
      );
      this.emit('navigate', { path, ...options });
    }
  };
};
```

### Animation Package
```typescript
// animate.js - GPU-accelerated animations
export const animate = (element, keyframes, options = {}) => {
  const {
    duration = 300,
    easing = 'ease',
    fill = 'forwards'
  } = options;
  
  // Use Web Animations API if available
  if (element.animate) {
    return element.animate(keyframes, { duration, easing, fill });
  }
  
  // Fallback to RAF
  return new Promise(resolve => {
    const start = performance.now();
    const from = getComputedStyles(element);
    
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easings[easing](progress);
      
      // Apply interpolated values
      applyKeyframe(element, from, keyframes, eased);
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(tick);
  });
};
```

## 🚀 Usage Examples

### Basic Component
```typescript
import { component, html, render } from '@brutal2';

const Counter = component({
  name: 'brutal-counter',
  
  behaviors: [
    withState({ count: 0 }),
    withEvents({
      inc() { this.state.count++ },
      dec() { this.state.count-- }
    })
  ],
  
  render() {
    return html`
      <div class="counter">
        <button @click=${this.dec}>-</button>
        <span>${this.state.count}</span>
        <button @click=${this.inc}>+</button>
      </div>
    `;
  }
});
```

### Reactive Store
```typescript
import { store, computed } from '@brutal2/state';

const app = store({
  todos: [],
  filter: 'all'
});

const filtered = computed(app, {
  visible: (state) => {
    if (state.filter === 'all') return state.todos;
    return state.todos.filter(t => 
      state.filter === 'active' ? !t.done : t.done
    );
  }
});

// Natural reactivity
app.todos = [...app.todos, { text: 'New todo', done: false }];
```

### Routing
```typescript
import { router } from '@brutal2/router';

const app = router([
  { path: '/', component: Home },
  { path: '/user/:id', component: User },
  { path: '/posts/:id?', component: Posts }
]);

app.on('navigate', ({ path, params }) => {
  const { route, params } = app.match(path);
  render(route.component(params), document.body);
});
```

## 📊 Bundle Size Targets

| Package | Dev (readable) | Prod (minified) | Features |
|---------|---------------|-----------------|----------|
| core    | 3KB          | 2KB             | 100%     |
| dom     | 3KB          | 2KB             | 100%     |
| state   | 1.5KB        | 1KB             | 100%     |
| events  | 1.5KB        | 1KB             | 100%     |
| router  | 1.5KB        | 1KB             | 100%     |
| animation| 1.5KB        | 1KB             | 100%     |
| utils   | 1KB          | 0.5KB           | 100%     |
| **TOTAL** | **14KB**   | **8.5KB**       | **100%** |

## 🔄 Migration from V5

```typescript
// Automated migration tool
import { migrate } from '@brutal2/compat';

// Old V5 code
class MyComponent extends Component {
  state = { count: 0 };
  render() { return `<div>${this.state.count}</div>`; }
}

// Migrated to brutal2
const MyComponent = migrate(OldComponent);
// Or manually:
const MyComponent = component({
  behaviors: [withState({ count: 0 })],
  render() { return html`<div>${this.state.count}</div>`; }
});
```

## ✅ Deliverables

1. **Core packages** (8.5KB total)
2. **TypeScript definitions**
3. **Comprehensive examples**
4. **Migration guide**
5. **Performance benchmarks**
6. **API documentation**

---

**Ready to build @brutal2 - pure signal, zero noise.**