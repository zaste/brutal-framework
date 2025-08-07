import { describe, test, expect, jest } from '@jest/globals';
import { c as createStore, l as createSelector } from '../src/minimal';

describe('@brutal/state - Selectors', () => {
  describe('createSelector', () => {
    test('should memoize selector results', () => {
      const store = createStore({ 
        items: [1, 2, 3],
        filter: 'all'
      });
      
      let computeCount = 0;
      const selector = createSelector((state: any) => {
        computeCount++;
        return state.items.filter((i: number) => i > 1);
      });
      
      // First call
      const result1 = selector(store.g());
      expect(result1).toEqual([2, 3]);
      expect(computeCount).toBe(1);
      
      // Same state, should use memoized result
      const result2 = selector(store.g());
      expect(result2).toBe(result1);
      expect(computeCount).toBe(1);
      
      // Different state
      store.s({ items: [1, 2, 3, 4] });
      const result3 = selector(store.g());
      expect(result3).toEqual([2, 3, 4]);
      expect(computeCount).toBe(2);
    });

    test('should use custom equality function', () => {
      const store = createStore({ value: { count: 1 } });
      
      let computeCount = 0;
      const selector = createSelector(
        (state: any) => {
          computeCount++;
          return state.value;
        },
        (a, b) => a.count === b.count
      );
      
      const result1 = selector(store.g());
      expect(computeCount).toBe(1);
      
      // Same count, different object reference
      store.s({ value: { count: 1 } });
      const result2 = selector(store.g());
      expect(result2).toBe(result1); // Same result due to custom equality
      expect(computeCount).toBe(1);
      
      // Different count
      store.s({ value: { count: 2 } });
      const result3 = selector(store.g());
      expect(result3).not.toBe(result1);
      expect(computeCount).toBe(2);
    });

    test('should handle undefined initial value', () => {
      const selector = createSelector((state: any) => state.value);
      
      expect(selector({ value: undefined })).toBe(undefined);
      expect(selector({ value: null })).toBe(null);
      expect(selector({ value: 0 })).toBe(0);
    });
  });

  describe('selector composition', () => {
    test('should compose multiple selectors', () => {
      const store = createStore({
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
          { id: 3, name: 'Charlie', active: true }
        ],
        filter: 'active'
      });
      
      const getUsers = createSelector((state: any) => state.users);
      const getFilter = createSelector((state: any) => state.filter);
      
      const getFilteredUsers = createSelector((state: any) => {
        const users = getUsers(state);
        const filter = getFilter(state);
        
        if (filter === 'active') {
          return users.filter((u: any) => u.active);
        }
        return users;
      });
      
      expect(getFilteredUsers(store.g())).toEqual([
        { id: 1, name: 'Alice', active: true },
        { id: 3, name: 'Charlie', active: true }
      ]);
      
      store.s({ filter: 'all' });
      expect(getFilteredUsers(store.g())).toHaveLength(3);
    });
  });

  describe('performance', () => {
    test('should efficiently handle high-frequency updates', () => {
      const store = createStore({ count: 0, ignored: 0 });
      
      let computeCount = 0;
      const selector = createSelector((state: any) => {
        computeCount++;
        return state.count * 2;
      });
      
      // Update ignored property many times
      for (let i = 0; i < 100; i++) {
        store.s({ ignored: i });
        selector(store.g()); // Should use memoized result
      }
      
      expect(computeCount).toBe(1); // Only computed once
      
      // Update relevant property
      store.s({ count: 1 });
      selector(store.g());
      expect(computeCount).toBe(2);
    });
  });
});