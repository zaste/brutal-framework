import { describe, it, expect, jest } from '@jest/globals';
import { createStore } from './store.js';

describe('createStore', () => {
  it('should create store with initial state', () => {
    const store = createStore({ count: 0 });
    
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state with setState', () => {
    const store = createStore({ count: 0, name: 'test' });
    
    store.setState({ count: 1 });
    
    expect(store.getState()).toEqual({ count: 1, name: 'test' });
  });

  it('should notify subscribers on state change', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();
    
    store.subscribe(listener);
    store.setState({ count: 1 });
    
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it('should handle unsubscribe', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();
    
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    
    store.setState({ count: 1 });
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should merge partial state updates', () => {
    const store = createStore({ a: 1, b: 2, c: 3 });
    
    store.setState({ b: 20 });
    
    expect(store.getState()).toEqual({ a: 1, b: 20, c: 3 });
  });
});
