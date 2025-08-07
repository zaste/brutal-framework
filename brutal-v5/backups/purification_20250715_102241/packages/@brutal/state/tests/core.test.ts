import { describe, test, expect, beforeEach } from '@jest/globals';
import { c as createStore, h as shallow } from '../src/minimal';

describe('@brutal/state - Core Store', () => {
  describe('createStore', () => {
    test('should create a store with initial state', () => {
      const store = createStore({ count: 0, name: 'test' });
      
      expect(store.g()).toEqual({ count: 0, name: 'test' });
    });

    test('should create a store with initial state function', () => {
      const store = createStore(() => ({ count: 5 }));
      
      expect(store.g()).toEqual({ count: 5 });
    });

    test('should allow direct property access', () => {
      const store = createStore({ count: 10, user: { name: 'John' } });
      
      expect(store.count).toBe(10);
      expect(store.user).toEqual({ name: 'John' });
    });
  });

  describe('setState', () => {
    test('should update state with partial object', () => {
      const store = createStore({ count: 0, name: 'test' });
      
      store.s({ count: 5 });
      expect(store.g()).toEqual({ count: 5, name: 'test' });
    });

    test('should update state with function', () => {
      const store = createStore({ count: 0 });
      
      store.s(state => ({ count: state.count + 1 }));
      expect(store.count).toBe(1);
    });

    test('should replace state entirely when not partial', () => {
      const store = createStore({ a: 1, b: 2 });
      
      store.s({ c: 3 } as any);
      expect(store.g()).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('should handle null/undefined updates', () => {
      const store = createStore({ value: 'test' } as any);
      
      store.s({ value: null });
      expect(store.value).toBe(null);
      
      store.s({ value: undefined });
      expect(store.value).toBe(undefined);
    });

    test('should not notify when state is identical', () => {
      const store = createStore({ count: 0 });
      let callCount = 0;
      
      store.u(() => callCount++);
      
      store.s({ count: 0 });
      expect(callCount).toBe(0);
      
      store.s({ count: 1 });
      expect(callCount).toBe(1);
    });
  });

  describe('subscribe', () => {
    test('should notify listeners on state change', () => {
      const store = createStore({ count: 0 });
      let newState: any;
      let oldState: any;
      
      store.u((s, p) => {
        newState = s;
        oldState = p;
      });
      
      store.s({ count: 1 });
      
      expect(newState).toEqual({ count: 1 });
      expect(oldState).toEqual({ count: 0 });
    });

    test('should return unsubscribe function', () => {
      const store = createStore({ count: 0 });
      let callCount = 0;
      
      const unsubscribe = store.u(() => callCount++);
      
      store.s({ count: 1 });
      expect(callCount).toBe(1);
      
      unsubscribe();
      store.s({ count: 2 });
      expect(callCount).toBe(1);
    });

    test('should handle multiple subscribers', () => {
      const store = createStore({ count: 0 });
      const calls: number[] = [];
      
      store.u(() => calls.push(1));
      store.u(() => calls.push(2));
      store.u(() => calls.push(3));
      
      store.s({ count: 1 });
      
      expect(calls).toEqual([1, 2, 3]);
    });
  });

  describe('destroy', () => {
    test('should clear all listeners', () => {
      const store = createStore({ count: 0 });
      let callCount = 0;
      
      store.u(() => callCount++);
      store.u(() => callCount++);
      
      store.d();
      store.s({ count: 1 });
      
      expect(callCount).toBe(0);
    });
  });

  describe('proxy behavior', () => {
    test('should update via direct property assignment', () => {
      const store = createStore({ count: 0, name: 'test' });
      
      store.count = 5;
      expect(store.g()).toEqual({ count: 5, name: 'test' });
      
      store.name = 'updated';
      expect(store.g()).toEqual({ count: 5, name: 'updated' });
    });

    test('should notify listeners on property assignment', () => {
      const store = createStore({ value: 'initial' });
      let called = false;
      
      store.u(() => called = true);
      store.value = 'updated';
      
      expect(called).toBe(true);
      expect(store.value).toBe('updated');
    });

    test('should prevent overwriting API methods', () => {
      const store = createStore({ data: 'test' });
      
      // Try to overwrite API method
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      try {
        (store as any).g = 'overwrite';
      } catch {
        // Expected to throw
      }
      
      expect(spy).toHaveBeenCalledWith('Cannot overwrite store method: g');
      spy.mockRestore();
      
      // Should still be a function
      expect(typeof store.g).toBe('function');
      expect(store.g()).toEqual({ data: 'test' });
    });
  });

  describe('shallow equality', () => {
    test('should return true for identical values', () => {
      expect(shallow(1, 1)).toBe(true);
      expect(shallow('test', 'test')).toBe(true);
      expect(shallow(null, null)).toBe(true);
      expect(shallow(undefined, undefined)).toBe(true);
    });

    test('should return true for same object reference', () => {
      const obj = { a: 1 };
      expect(shallow(obj, obj)).toBe(true);
    });

    test('should return false for different primitives', () => {
      expect(shallow(1, 2)).toBe(false);
      expect(shallow('a', 'b')).toBe(false);
      expect(shallow(true, false)).toBe(false);
    });

    test('should perform shallow comparison for objects', () => {
      expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallow({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    test('should not deep compare nested objects', () => {
      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 1 } };
      expect(shallow(obj1, obj2)).toBe(false);
      
      const shared = { b: 1 };
      expect(shallow({ a: shared }, { a: shared })).toBe(true);
    });

    test('should handle null and undefined', () => {
      expect(shallow(null, undefined)).toBe(false);
      expect(shallow({}, null)).toBe(false);
      expect(shallow(null, {})).toBe(false);
    });
  });
});