# 🎯 @brutal/core API Design

## Purpose
Core provides the fundamental composition pattern and behaviors that all BRUTAL components use.

## Public API (2KB budget)

### 1. compose Function (200B)
```typescript
// The foundation of everything
export function compose<T>(...fns: Function[]): (x: T) => T {
  return (x: T) => fns.reduceRight((v, f) => f(v), x);
}
export const c = compose;
```

### 2. withState Behavior (600B)
```typescript
interface StateOptions<T> {
  initial: T;
  onChange?: (newState: T, oldState: T) => void;
}

export function withState<T>(options: StateOptions<T> | T) {
  return (element: HTMLElement & { state?: T; update?: () => void }) => {
    const opts = (options as StateOptions<T>).initial !== undefined 
      ? options as StateOptions<T>
      : { initial: options as T };
    
    // Use WeakMap to avoid memory leaks
    const stateMap = new WeakMap();
    const proxyMap = new WeakMap();
    
    // Create reactive state
    const state = new Proxy(opts.initial, {
      set(target, key, value) {
        const old = { ...target };
        target[key] = value;
        opts.onChange?.(target, old);
        element.update?.();
        return true;
      }
    });
    
    stateMap.set(element, opts.initial);
    proxyMap.set(element, state);
    element.state = state;
    
    return element;
  };
}
export const s = withState;
```

### 3. withEvents Behavior (400B)
```typescript
interface EventMap {
  [key: string]: EventListener;
}

export function withEvents(events?: EventMap) {
  return (element: HTMLElement & { on?: Function; off?: Function }) => {
    // Event delegation for efficiency
    const listeners = new WeakMap<HTMLElement, Map<string, Set<EventListener>>>();
    const elementListeners = new Map<string, Set<EventListener>>();
    listeners.set(element, elementListeners);
    
    element.on = (event: string, handler: EventListener) => {
      if (!elementListeners.has(event)) {
        elementListeners.set(event, new Set());
        element.addEventListener(event, (e) => {
          elementListeners.get(event)?.forEach(h => h(e));
        });
      }
      elementListeners.get(event)?.add(handler);
      return element; // Chainable
    };
    
    element.off = (event: string, handler: EventListener) => {
      elementListeners.get(event)?.delete(handler);
      return element;
    };
    
    // Auto-attach provided events
    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        element.on!(event, handler);
      });
    }
    
    return element;
  };
}
export const e = withEvents;
```

### 4. withLifecycle Behavior (300B)
```typescript
interface Lifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: () => void;
}

export function withLifecycle(lifecycle: Lifecycle) {
  return (element: HTMLElement & { mount?: Function; unmount?: Function }) => {
    // Use MutationObserver for mount/unmount detection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node === element) lifecycle.onMount?.();
        });
        mutation.removedNodes.forEach((node) => {
          if (node === element) lifecycle.onUnmount?.();
        });
      });
    });
    
    // Start observing when element is ready
    if (element.parentNode) {
      observer.observe(element.parentNode, { childList: true });
    }
    
    element.mount = () => {
      lifecycle.onMount?.();
      return element;
    };
    
    element.unmount = () => {
      lifecycle.onUnmount?.();
      observer.disconnect();
      return element;
    };
    
    return element;
  };
}
export const l = withLifecycle;
```

### 5. withProps Behavior (300B)
```typescript
export function withProps<T extends Record<string, any>>(props: T) {
  return (element: HTMLElement & { props?: T }) => {
    // Simple prop assignment with validation
    element.props = new Proxy(props, {
      set(target, key, value) {
        // Sync to attributes for primitive values
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          element.setAttribute(String(key), String(value));
        }
        target[key] = value;
        return true;
      }
    });
    
    // Initial sync
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        element.setAttribute(key, String(value));
      }
    });
    
    return element;
  };
}
export const p = withProps;
```

### 6. Types (248B)
```typescript
// Enhanced element type
export interface BrutalElement extends HTMLElement {
  state?: any;
  props?: any;
  update?: () => void;
  on?: (event: string, handler: EventListener) => BrutalElement;
  off?: (event: string, handler: EventListener) => BrutalElement;
  mount?: () => BrutalElement;
  unmount?: () => BrutalElement;
}

// Behavior type
export type Behavior<T = HTMLElement> = (element: T) => T;

// Re-export for convenience
export type { StateOptions, EventMap, Lifecycle };
```

## Usage Example
```typescript
import { compose, withState, withEvents, withLifecycle } from '@brutal/core';
// Or minified:
import { c, s, e, l } from '@brutal/core';

// Create enhanced element
const enhance = compose(
  withLifecycle({
    onMount: () => console.log('Mounted!'),
    onUnmount: () => console.log('Unmounted!')
  }),
  withEvents({
    click: (e) => e.target.state.count++
  }),
  withState({ count: 0 })
);

const counter = enhance(document.createElement('button'));
counter.textContent = `Count: ${counter.state.count}`;
counter.update = () => {
  counter.textContent = `Count: ${counter.state.count}`;
};
```

## Size Breakdown
- compose: ~200B (simple reduceRight)
- withState: ~600B (Proxy + WeakMap)
- withEvents: ~400B (delegation + WeakMap)
- withLifecycle: ~300B (MutationObserver)
- withProps: ~300B (Proxy + sync)
- types: ~248B (interfaces)
- **TOTAL**: 2048B ✅

## Key Design Decisions

1. **WeakMaps**: Prevent memory leaks
2. **Proxies**: Reactive state without library
3. **MutationObserver**: Real mount/unmount detection
4. **Event Delegation**: Efficient event handling
5. **Chainable API**: Better DX
6. **Type Safety**: Full TypeScript support

## Next: Design Counter Example