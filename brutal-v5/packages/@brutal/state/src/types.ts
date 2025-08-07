/**
 * Type definitions for @brutal/state
 */

// Core store types
export interface StoreApi<T extends State = State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: StateListener<T>) => () => void;
  destroy: () => void;
}

// State can be any object
export type State = Record<string, any>;

// Listener function type
export type StateListener<T> = (state: T, prevState: T) => void;

// Selector function
export type StateSelector<T, U> = (state: T) => U;

// Equality function for shallow comparison
export type EqualityFn<T> = (a: T, b: T) => boolean;

// Store creator function
export interface StoreCreator {
  <T extends State>(initialState: T | (() => T)): StoreApi<T> & T;
}

// Middleware types
export type StateMiddleware<T extends State = State> = (
  config: MiddlewareConfig<T>
) => (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;

export interface MiddlewareConfig<T extends State = State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
}

// Devtools configuration
export interface DevtoolsConfig {
  name?: string;
  enabled?: boolean;
}

// Persistence configuration
export interface PersistConfig<T extends State = State> {
  name: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
  partialize?: (state: T) => Partial<T>;
  merge?: (persistedState: any, currentState: T) => T;
}

// Computed values
export type ComputedValue<T extends State, U> = {
  get: (state: T) => U;
  dependencies?: (keyof T)[];
};

// React integration types
export interface UseBoundStore<T extends State = State> {
  (): T;
  <U>(selector: StateSelector<T, U>): U;
  <U>(selector: StateSelector<T, U>, equalityFn: EqualityFn<U>): U;
}

// Subscribe with selector
export interface SubscribeWithSelector<T extends State = State> {
  <U>(
    selector: StateSelector<T, U>,
    listener: (value: U, prevValue: U) => void,
    equalityFn?: EqualityFn<U>
  ): () => void;
}

// Time travel debugging
export interface TimeTravelState<T extends State = State> {
  past: T[];
  present: T;
  future: T[];
}

export interface TimeTravelActions {
  undo: () => void;
  redo: () => void;
  jump: (index: number) => void;
  clear: () => void;
}