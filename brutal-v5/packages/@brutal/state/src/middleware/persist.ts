/**
 * Persistence middleware for localStorage/sessionStorage
 */

import type { State, StoreApi, PersistConfig } from '../types';

/**
 * Default serialization
 */
const serialize = <T>(state: T): string => {
  return JSON.stringify(state);
};

/**
 * Default deserialization
 */
const deserialize = <T>(str: string): T => {
  return JSON.parse(str);
};

/**
 * Persist store to storage
 */
export const persist = <T extends State>(
  api: StoreApi<T>,
  config: PersistConfig<T>
): (() => void) => {
  const {
    name,
    storage = typeof window !== 'undefined' ? window.localStorage : undefined,
    serialize: customSerialize = serialize,
    deserialize: customDeserialize = deserialize,
    partialize = (state: T) => state as Partial<T>,
    merge = (persistedState: any, currentState: T) => ({ ...currentState, ...persistedState } as T)
  } = config;
  
  if (!storage) {
    console.warn('No storage available for persistence');
    return () => {};
  }
  
  // Load persisted state
  const loadPersistedState = (): Partial<T> | null => {
    try {
      const item = storage.getItem(name);
      if (!item) return null;
      
      return customDeserialize(item);
    } catch (e) {
      console.error('Failed to load persisted state:', e);
      return null;
    }
  };
  
  // Save state to storage
  const saveState = (state: T): void => {
    try {
      const stateToSave = partialize(state);
      storage.setItem(name, customSerialize(stateToSave));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  };
  
  // Hydrate store with persisted state
  const persistedState = loadPersistedState();
  if (persistedState) {
    api.setState((currentState) => merge(persistedState, currentState));
  }
  
  // Subscribe to state changes
  const unsubscribe = api.subscribe((state) => {
    saveState(state);
  });
  
  // Also save current state immediately
  saveState(api.getState());
  
  // Return cleanup function
  return unsubscribe;
};

/**
 * Clear persisted state
 */
export const clearPersistedState = (name: string, storage?: Storage): void => {
  const storageToUse = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (storageToUse) {
    storageToUse.removeItem(name);
  }
};