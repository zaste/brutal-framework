# 🚀 @brutal2 Architecture

*Clean. Minimal. Composed.*

## Core Principles
1. **Everything is a function** (no classes except Web Components)
2. **Composition over inheritance** 
3. **One way to do things**
4. **Zero dependencies**
5. **Under 20KB total**

## Package Structure
```
@brutal2/
├── core/      # 5KB - Foundation
├── dom/       # 3KB - Templates & rendering  
├── state/     # 3KB - Reactive stores
├── events/    # 2KB - Event system
├── router/    # 3KB - SPA routing
├── http/      # 2KB - Fetch wrapper
└── utils/     # 2KB - Shared utilities
```

## API Design

### Core - Composition Utilities
```typescript
// Pure composition
export const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

// Behaviors
export const withState = (element) => { /* adds state */ };
export const withEvents = (element) => { /* adds events */ };
export const withLifecycle = (element) => { /* adds lifecycle */ };

// Component factory
export const component = (config) => compose(
  ...config.behaviors,
  withLifecycle,
  withEvents,
  withState
)(document.createElement(config.tag || 'div'));
```

### DOM - Templates
```typescript
// Single template implementation
export const html = (strings, ...values) => {
  // Ultra-optimized template compilation
};

// Render
export const render = (template, container) => {
  // Efficient DOM updates
};
```

### State - Reactive Stores
```typescript
// Functional state management
export const store = (initial) => {
  const subscribers = new Set();
  let state = initial;
  
  return {
    get: () => state,
    set: (updates) => {
      state = { ...state, ...updates };
      subscribers.forEach(fn => fn(state));
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };
};
```

### Events - Unified System
```typescript
// Global event bus
export const events = {
  on: (event, handler) => { /* subscribe */ },
  off: (event, handler) => { /* unsubscribe */ },
  emit: (event, data) => { /* publish */ },
  once: (event, handler) => { /* one-time */ }
};
```

### Router - SPA Navigation
```typescript
// Simple, powerful routing
export const router = (routes) => {
  // Pattern matching
  // History management
  // Lazy loading
};
```

### HTTP - Fetch Enhanced
```typescript
// Better fetch
export const http = {
  get: (url, options) => { /* with defaults */ },
  post: (url, data, options) => { /* json handling */ },
  // ... put, delete, patch
};
```

## Key Differences from V1

### Before (V1):
```typescript
// Inheritance mess
class Component extends HTMLElement { }
class Button extends Component { }

// Multiple implementations
import { compile } from './compiler';
import { parse } from './parser';
import { render } from './renderer';
```

### After (V2):
```typescript
// Pure composition
const Button = component({
  tag: 'button',
  behaviors: [withRipple, withTheme]
});

// Single implementation
import { html, render } from '@brutal2/dom';
```

## Migration Path

```typescript
// Compatibility layer
import { migrate } from '@brutal2/compat';

// Old code
class MyComponent extends Component { }

// Automated migration
const MyComponent = migrate(OldComponent);
```

## Bundle Strategy

### Development:
- Readable code
- Source maps
- Dev tools integration

### Production:
```typescript
// Everything minified to single letters
export const c=(...f)=>x=>f.reduceRight((v,g)=>g(v),x);
```

## Zero Dependencies Maintained
- No external packages
- No polyfills needed (modern browsers)
- No build step required (pure ES modules)

## Timeline

1. **Day 1**: Core + DOM
2. **Day 2**: State + Events  
3. **Day 3**: Router + HTTP
4. **Day 4**: Utils + Testing
5. **Day 5**: Examples + Migration

Total: **20KB of pure, composed power**