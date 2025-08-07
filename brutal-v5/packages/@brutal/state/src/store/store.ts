/**
 * State store for BRUTAL
 */

export interface Store<T> {
  getState(): T;
  setState(state: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();
  
  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
