/**
 * Core behaviors for element enhancement
 */

import { BrutalElement, StateOptions, EventMap, Lifecycle } from './types';

// WeakMaps to prevent memory leaks
const stateMap = new WeakMap<HTMLElement, any>();
const listenersMap = new WeakMap<HTMLElement, Map<string, Set<EventListener>>>();
const observerMap = new WeakMap<HTMLElement, MutationObserver>();

/**
 * Adds reactive state to an element
 */
export function withState<T>(options: StateOptions<T> | T) {
  return (element: HTMLElement & { state?: T; update?: () => void }) => {
    const opts = (options as StateOptions<T>).initial !== undefined 
      ? options as StateOptions<T>
      : { initial: options as T };
    
    // Create reactive state with Proxy
    const state = new Proxy(opts.initial as any, {
      set(target, key, value) {
        const old = { ...target };
        target[key] = value;
        opts.onChange?.(target, old);
        element.update?.();
        return true;
      }
    });
    
    stateMap.set(element, state);
    element.state = state;
    
    return element;
  };
}

/**
 * Adds event handling with delegation
 */
export function withEvents(events?: EventMap) {
  return (element: HTMLElement & { on?: Function; off?: Function }) => {
    const elementListeners = new Map<string, Set<EventListener>>();
    listenersMap.set(element, elementListeners);
    
    element.on = (event: string, handler: EventListener) => {
      if (!elementListeners.has(event)) {
        elementListeners.set(event, new Set());
        // Single listener per event type for efficiency
        element.addEventListener(event, (e) => {
          elementListeners.get(event)?.forEach(h => h(e));
        });
      }
      elementListeners.get(event)?.add(handler);
      return element as BrutalElement;
    };
    
    element.off = (event: string, handler: EventListener) => {
      elementListeners.get(event)?.delete(handler);
      return element as BrutalElement;
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

/**
 * Adds lifecycle hooks
 */
export function withLifecycle(lifecycle: Lifecycle) {
  return (element: HTMLElement & { mount?: Function; unmount?: Function }) => {
    // Use MutationObserver for mount/unmount detection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node === element) lifecycle.onMount?.();
        });
        mutation.removedNodes.forEach((node) => {
          if (node === element) {
            lifecycle.onUnmount?.();
            observer.disconnect();
          }
        });
      });
    });
    
    // Start observing parent or document
    const startObserving = () => {
      const target = element.parentNode || document.body;
      observer.observe(target, { childList: true, subtree: true });
    };
    
    element.mount = () => {
      startObserving();
      lifecycle.onMount?.();
      return element as BrutalElement;
    };
    
    element.unmount = () => {
      lifecycle.onUnmount?.();
      observer.disconnect();
      observerMap.delete(element);
      return element as BrutalElement;
    };
    
    observerMap.set(element, observer);
    
    // Auto-start if already in DOM
    if (element.parentNode) {
      startObserving();
    }
    
    return element;
  };
}

/**
 * Adds props with attribute sync
 */
export function withProps<T extends Record<string, any>>(props: T) {
  return (element: HTMLElement & { props?: T }) => {
    // Create reactive props
    element.props = new Proxy(props, {
      set(target, key, value) {
        // Sync to attributes for primitive values
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          element.setAttribute(String(key), String(value));
        }
        target[key as keyof T] = value;
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

