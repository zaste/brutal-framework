/**
 * Core store implementation
 */

import type {
  State,
  StoreApi,
  StateListener,
  StoreCreator
} from '../types';

/**
 * Creates a new store with the given initial state
 */
export const createStore: StoreCreator = <T extends State>(
  initialState: T | (() => T)
): StoreApi<T> & T => {
  // Initialize state
  let state: T = typeof initialState === 'function' 
    ? initialState() 
    : initialState;
  
  // Listeners set
  const listeners = new Set<StateListener<T>>();
  
  // API methods
  const api: StoreApi<T> = {
    getState: () => state,
    
    setState: (partial) => {
      const nextState = typeof partial === 'function'
        ? partial(state)
        : partial;
      
      if (Object.is(nextState, state)) return;
      
      const previousState = state;
      state = (
        nextState != null && typeof nextState === 'object' && !Array.isArray(nextState)
          ? Object.assign({}, state, nextState)
          : nextState
      ) as T;
      
      listeners.forEach(listener => {
        listener(state, previousState);
      });
    },
    
    subscribe: (listener) => {
      listeners.add(listener);
      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },
    
    destroy: () => {
      listeners.clear();
    }
  };
  
  // Create proxy to allow direct property access
  const store = new Proxy(api as StoreApi<T> & T, {
    get(target, prop: string | symbol) {
      // If accessing API method, return it
      if (prop in target) {
        return target[prop as keyof StoreApi<T>];
      }
      // Otherwise, return state property
      const currentState = api.getState();
      return currentState[prop as keyof T];
    },
    
    set(_, prop: string | symbol, value) {
      if (prop in api) {
        // Prevent overwriting API methods
        console.warn(`Cannot overwrite store method: ${String(prop)}`);
        return false;
      }
      
      // Update state property
      api.setState({ [prop]: value } as Partial<T>);
      return true;
    },
    
    has(_, prop: string | symbol) {
      return prop in api || prop in api.getState();
    },
    
    ownKeys() {
      return Object.keys(api.getState());
    },
    
    getOwnPropertyDescriptor(_, prop: string | symbol) {
      if (prop in api) {
        return Object.getOwnPropertyDescriptor(api, prop);
      }
      const currentState = api.getState();
      if (prop in currentState) {
        return {
          enumerable: true,
          configurable: true,
          value: currentState[prop as keyof T]
        };
      }
      return undefined;
    }
  });
  
  return store;
};

/**
 * Shallow equality check
 */
export const shallow = <T>(objA: T, objB: T): boolean => {
  if (Object.is(objA, objB)) return true;
  
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i]!;
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(
        objA[key as keyof T], 
        objB[key as keyof T]
      )
    ) {
      return false;
    }
  }
  
  return true;
};