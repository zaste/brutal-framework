/**
 * Create reactive stores with zero boilerplate
 */

import { Store, StoreConfig, Action, Subscriber } from './types';

/**
 * Creates a reactive store from config object
 * Actions are functions, everything else is state
 */
export function createStore<T extends StoreConfig>(config: T): Store<T> {
  // Separate state from actions
  const state: any = {};
  const actions: Record<string, Action> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      actions[key] = value;
    } else {
      state[key] = value;
    }
  }
  
  // Subscribers
  const subscribers = new Set<Subscriber>();
  
  // Create reactive proxy
  const store = new Proxy(state, {
    get(target, prop: string) {
      // Special methods
      if (prop === 'subscribe') {
        return (fn: Subscriber) => {
          subscribers.add(fn);
          fn(target); // Call immediately
          return () => subscribers.delete(fn);
        };
      }
      
      // Actions
      if (prop in actions) {
        return (...args: any[]) => {
          const updates = actions[prop](target, ...args);
          if (updates && typeof updates === 'object') {
            Object.assign(target, updates);
            subscribers.forEach(fn => fn(target));
          }
          return updates;
        };
      }
      
      // State
      return target[prop];
    },
    
    set(target, prop: string, value) {
      target[prop] = value;
      subscribers.forEach(fn => fn(target));
      return true;
    }
  }) as Store<T>;
  
  return store;
}