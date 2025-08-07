/**
 * Selector utilities for optimized subscriptions
 */

import type {
  State,
  StoreApi,
  StateSelector,
  StateListener,
  EqualityFn,
  SubscribeWithSelector
} from '../types';
import { shallow } from './core';

/**
 * Subscribe with selector for optimized updates
 */
export const subscribeWithSelector = <T extends State>(
  api: StoreApi<T>
): SubscribeWithSelector<T> => {
  return <U>(
    selector: StateSelector<T, U>,
    listener: (value: U, prevValue: U) => void,
    equalityFn: EqualityFn<U> = Object.is
  ) => {
    let currentValue = selector(api.getState());
    
    const stateListener: StateListener<T> = (state) => {
      const nextValue = selector(state);
      if (!equalityFn(currentValue, nextValue)) {
        const previousValue = currentValue;
        currentValue = nextValue;
        listener(nextValue, previousValue);
      }
    };
    
    return api.subscribe(stateListener);
  };
};

/**
 * Create a memoized selector
 */
export const createSelector = <T extends State, U>(
  selector: StateSelector<T, U>
): StateSelector<T, U> => {
  let lastState: T | undefined;
  let lastResult: U;
  
  return (state: T): U => {
    if (lastState === undefined || !shallow(state, lastState)) {
      lastState = state;
      lastResult = selector(state);
    }
    return lastResult;
  };
};

/**
 * Combine multiple selectors
 */
export const combineSelectors = <T extends State, R extends any[]>(
  ...selectors: { [K in keyof R]: StateSelector<T, R[K]> }
): StateSelector<T, R> => {
  return (state: T): R => {
    return selectors.map(selector => selector(state)) as R;
  };
};

/**
 * Create computed selector with dependencies
 */
export const computed = <T extends State, U>(
  dependencies: StateSelector<T, any>[],
  compute: (...args: any[]) => U,
  equalityFn: EqualityFn<any[]> = shallow
): StateSelector<T, U> => {
  let lastDeps: any[] | undefined;
  let lastResult: U;
  
  return (state: T): U => {
    const currentDeps = dependencies.map(dep => dep(state));
    
    if (lastDeps === undefined || !equalityFn(currentDeps, lastDeps)) {
      lastDeps = currentDeps;
      lastResult = compute(...currentDeps);
    }
    
    return lastResult;
  };
};