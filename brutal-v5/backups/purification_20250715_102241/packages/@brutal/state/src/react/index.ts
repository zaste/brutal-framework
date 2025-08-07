/**
 * React integration for @brutal/state
 */

// @ts-ignore - React is an optional peer dependency
import { useSyncExternalStore } from 'react';
import type {
  State,
  StoreApi,
  StateSelector,
  EqualityFn,
  UseBoundStore
} from '../types';

/**
 * Create a React hook for the store
 */
export const createUseStore = <T extends State>(
  api: StoreApi<T>
): UseBoundStore<T> => {
  const useStore = <U = T>(
    selector?: StateSelector<T, U>,
    equalityFn?: EqualityFn<U>
  ): U extends T ? T : U => {
    const slice = useSyncExternalStore(
      api.subscribe,
      () => {
        const state = api.getState();
        return selector ? selector(state) : state;
      },
      () => {
        const state = api.getState();
        return selector ? selector(state) : state;
      }
    );
    
    // Use ref to track previous value for equality check
    const previousSliceRef = useRef(slice);
    
    if (equalityFn && !equalityFn(previousSliceRef.current as U, slice as U)) {
      previousSliceRef.current = slice;
    }
    
    return (equalityFn ? previousSliceRef.current : slice) as U extends T ? T : U;
  };
  
  return useStore as UseBoundStore<T>;
};

// Import React's useRef
const { useRef } = (() => {
  try {
    return require('react');
  } catch {
    // Fallback for environments where React is not available
    return {
      useRef: <T>(initialValue: T) => ({ current: initialValue })
    };
  }
})();

/**
 * React hook for shallow comparison
 */
export const useShallow = <T extends State, U>(
  selector: StateSelector<T, U>
): StateSelector<T, U> => {
  const prev = useRef<U | undefined>(undefined);
  
  return (state: T): U => {
    const next = selector(state);
    return isShallowEqual(prev.current, next) ? prev.current! : (prev.current = next);
  };
};

/**
 * Shallow equality helper
 */
const isShallowEqual = <T>(a: T | undefined, b: T): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (const key of aKeys) {
    if (!Object.is((a as any)[key], (b as any)[key])) {
      return false;
    }
  }
  
  return true;
};