# Pattern: Proxy-Based State Management

## Problem
Managing reactive state in web applications requires:
- Automatic UI updates when state changes
- Deep object observation
- Performance optimization for batched updates
- Memory efficiency
- Type safety

## Solution
Use native JavaScript Proxy API to create reactive state objects that automatically track changes and notify subscribers.

## V4 Implementation

```javascript
export class BrutalState extends EventTarget {
  constructor(initialState = {}) {
    super();
    
    // Internal storage
    this._rawState = { ...initialState };
    this._subscriptions = new Set();
    this._batchedUpdates = new Map();
    this._enableBatching = false;
    
    // Create reactive proxy
    this._state = this._createProxy(this._rawState);
  }

  _createProxy(target, path = []) {
    return new Proxy(target, {
      get: (obj, prop) => {
        const value = obj[prop];
        
        // Recursively proxy nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return this._createProxy(value, [...path, prop]);
        }
        
        return value;
      },
      
      set: (obj, prop, value) => {
        const oldValue = obj[prop];
        const fullPath = [...path, prop];
        
        // Update value
        obj[prop] = value;
        
        // Notify subscribers
        this._notifyChange(fullPath, value, oldValue);
        
        return true;
      },
      
      deleteProperty: (obj, prop) => {
        const oldValue = obj[prop];
        const fullPath = [...path, prop];
        
        delete obj[prop];
        
        this._notifyChange(fullPath, undefined, oldValue);
        
        return true;
      }
    });
  }

  // Subscribe to state changes
  subscribe(callback) {
    this._subscriptions.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscriptions.delete(callback);
    };
  }

  // Batch multiple updates
  batch(fn) {
    this._enableBatching = true;
    fn(this._state);
    this._flushBatchedUpdates();
    this._enableBatching = false;
  }

  // Get snapshot for time-travel
  getSnapshot() {
    return JSON.parse(JSON.stringify(this._rawState));
  }

  // Restore from snapshot
  restore(snapshot) {
    this._rawState = { ...snapshot };
    this._state = this._createProxy(this._rawState);
    this._notifyChange([], this._rawState, null);
  }
}
```

## Key Patterns

### 1. Recursive Proxy Creation
```javascript
// Nested objects automatically become reactive
const state = new BrutalState({
  user: {
    profile: {
      name: 'John'
    }
  }
});

state._state.user.profile.name = 'Jane'; // Triggers update
```

### 2. Path Tracking
```javascript
// Track exact path of changes
_notifyChange(path, value, oldValue) {
  const key = path.join('.'); // "user.profile.name"
  
  // Emit granular event
  this.dispatchEvent(new CustomEvent('statechange', {
    detail: { path: key, value, oldValue }
  }));
}
```

### 3. Batched Updates
```javascript
// Prevent multiple renders
state.batch(s => {
  s.count++;
  s.user.name = 'New Name';
  s.items.push(newItem);
}); // Single update notification
```

### 4. Memory Safety
```javascript
// WeakMap for component states
const componentStates = new WeakMap();

// Automatic cleanup on component disconnect
disconnectedCallback() {
  componentStates.delete(this);
}
```

## Performance Optimizations

### 1. Shallow vs Deep Updates
```javascript
// Shallow update (fast)
state._state = { ...state._state, topLevel: 'new' };

// Deep update (tracked)
state._state.deep.nested.value = 'new';
```

### 2. Subscription Management
```javascript
// Use WeakRef for auto-cleanup
class StateSubscriptions {
  constructor() {
    this.refs = new Set();
  }
  
  add(callback, component) {
    const ref = new WeakRef(component);
    const handler = (...args) => {
      const comp = ref.deref();
      if (comp) {
        callback.apply(comp, args);
      } else {
        this.refs.delete(handler);
      }
    };
    this.refs.add(handler);
    return handler;
  }
}
```

## Evolution Path

### V3 Issues
- String-based property paths
- No TypeScript support
- Memory leaks from subscriptions

### V4 Improvements
- Native Proxy API
- Automatic deep observation
- Proper cleanup patterns

### V5 Enhancements
- TypeScript generics for type safety
- Built-in computed properties
- Async state updates
- State middleware support

## Usage Example

```javascript
// In component
class MyComponent extends BrutalComponent {
  initializeState() {
    this.state = new BrutalState({
      count: 0,
      user: null
    });
    
    // Auto re-render on state change
    this.state.subscribe(() => {
      this.scheduleRender();
    });
  }
  
  increment() {
    this.state._state.count++;
  }
  
  async loadUser() {
    this.state._state.user = await fetchUser();
  }
}
```

## Trade-offs

✅ **Benefits**:
- Native browser API (no polyfill needed in modern browsers)
- Automatic deep reactivity
- Clean API
- Good performance

⚠️ **Considerations**:
- Proxy not available in IE11
- Can't proxy primitives directly
- Some edge cases with arrays
- Debugging can be tricky

## References
- V4: `/brutal-v4/core/state/State.js`
- MDN Proxy: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
- Vue 3 reactivity (similar approach)

---

*Proxies make reactivity invisible and inevitable.*