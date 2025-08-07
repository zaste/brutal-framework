/**
 * Integrate stores with components
 */

import { Store } from './types';

/**
 * Connects a store to a component
 * Auto-subscribes and provides store data
 */
export function withStore<T>(store: Store<T>) {
  return (element: HTMLElement & { update?: () => void; store?: T }) => {
    // Auto-subscribe to updates
    const unsubscribe = store.subscribe(() => {
      element.update?.();
    });
    
    // Expose store
    Object.defineProperty(element, 'store', {
      get: () => store,
      configurable: true
    });
    
    // Store unsubscribe for manual cleanup if needed
    (element as any)._unsubscribe = unsubscribe;
    
    return element;
  };
}