/**
 * Tests for shared utilities
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  isBrowser,
  isNode,
  isDeno,
  isWebWorker,
  uniqueId,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  getPath,
  setPath,
  camelCase,
  kebabCase,
  capitalize,
  last,
  chunk,
  shuffle,
  sleep,
  nextTick,
  timeout,
  parseQuery,
  stringifyQuery,
  utils
} from './index.js';

describe('Shared utilities', () => {
  describe('environment detection', () => {
    it('should detect browser environment', () => {
      expect(typeof isBrowser).toBe('boolean');
      expect(typeof isNode).toBe('boolean');
      expect(typeof isDeno).toBe('boolean');
      expect(typeof isWebWorker).toBe('boolean');
    });
  });
  
  describe('uniqueId()', () => {
    it('should generate unique IDs', () => {
      const id1 = uniqueId();
      const id2 = uniqueId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^brutal_\d+_/);
    });
    
    it('should use custom prefix', () => {
      const id = uniqueId('test');
      expect(id).toMatch(/^test_\d+_/);
    });
  });
  
  describe('debounce()', () => {
    it('should debounce function calls', async () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 50);
      
      debounced();
      debounced();
      debounced();
      
      expect(fn).not.toHaveBeenCalled();
      
      await sleep(60);
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should cancel debounced calls', async () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 50);
      
      debounced();
      debounced.cancel();
      
      await sleep(60);
      expect(fn).not.toHaveBeenCalled();
    });
  });
  
  describe('throttle()', () => {
    it('should throttle function calls', async () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);
      
      // First call should execute immediately
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Subsequent calls within throttle period should be queued
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
      
      // After throttle period, queued call should execute
      await sleep(150);
      expect(fn).toHaveBeenCalledTimes(2);
      
      // New call after throttle period should execute immediately
      throttled();
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should cancel throttled calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 50);
      
      throttled();
      throttled.cancel();
      throttled();
      
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('deepClone()', () => {
    it('should clone primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(null)).toBe(null);
    });
    
    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
    
    it('should clone arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
      expect(cloned[2]).not.toBe(arr[2]);
    });
    
    it('should clone dates', () => {
      const date = new Date();
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
    
    it('should clone sets', () => {
      const set = new Set([1, 2, 3]);
      const cloned = deepClone(set);
      
      expect(cloned).toEqual(set);
      expect(cloned).not.toBe(set);
    });
    
    it('should clone maps', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const cloned = deepClone(map);
      
      expect(cloned).toEqual(map);
      expect(cloned).not.toBe(map);
    });
  });
  
  describe('deepMerge()', () => {
    it('should merge objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toBe(target);
      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      });
    });
    
    it('should handle multiple sources', () => {
      const result = deepMerge(
        { a: 1 },
        { b: 2 },
        { c: 3 }
      );
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
    
    it('should ignore undefined values', () => {
      const result = deepMerge(
        { a: 1, b: 2 },
        { b: undefined, c: 3 }
      );
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });
  
  describe('path utilities', () => {
    const obj = {
      a: {
        b: {
          c: 123
        }
      },
      x: [1, 2, 3]
    };
    
    describe('getPath()', () => {
      it('should get nested values', () => {
        expect(getPath(obj, 'a.b.c')).toBe(123);
        expect(getPath(obj, 'x.1')).toBe(2);
      });
      
      it('should return default for missing paths', () => {
        expect(getPath(obj, 'a.b.d', 'default')).toBe('default');
        expect(getPath(obj, 'y.z')).toBeUndefined();
      });
    });
    
    describe('setPath()', () => {
      it('should set nested values', () => {
        const target = {};
        setPath(target, 'a.b.c', 123);
        expect(target).toEqual({ a: { b: { c: 123 } } });
      });
      
      it('should overwrite existing values', () => {
        const target = { a: { b: 1 } };
        setPath(target, 'a.b', 2);
        expect(target.a.b).toBe(2);
      });
    });
  });
  
  describe('string utilities', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('foo-bar')).toBe('fooBar');
      expect(camelCase('foo-bar-baz')).toBe('fooBarBaz');
    });
    
    it('should convert to kebab-case', () => {
      expect(kebabCase('fooBar')).toBe('foo-bar');
      expect(kebabCase('FooBarBaz')).toBe('foo-bar-baz');
    });
    
    it('should capitalize strings', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
    });
  });
  
  describe('array utilities', () => {
    it('should get last element', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last([])).toBeUndefined();
    });
    
    it('should chunk arrays', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });
    
    it('should shuffle arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      
      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled).not.toBe(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });
  });
  
  describe('promise utilities', () => {
    it('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
    
    it('should execute on next tick', async () => {
      let executed = false;
      nextTick().then(() => { executed = true; });
      
      expect(executed).toBe(false);
      await nextTick();
      expect(executed).toBe(true);
    });
    
    it('should timeout promises', async () => {
      const promise = sleep(100);
      
      await expect(timeout(promise, 50)).rejects.toThrow('Timeout after 50ms');
    });
    
    it('should resolve before timeout', async () => {
      const promise = Promise.resolve('value');
      const result = await timeout(promise, 50);
      
      expect(result).toBe('value');
    });
  });
  
  describe('URL utilities', () => {
    it('should parse query strings', () => {
      expect(parseQuery('a=1&b=2')).toEqual({ a: '1', b: '2' });
      expect(parseQuery('?foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' });
      expect(parseQuery('')).toEqual({});
    });
    
    it('should stringify query objects', () => {
      expect(stringifyQuery({ a: 1, b: 2 })).toBe('a=1&b=2');
      expect(stringifyQuery({ foo: 'bar', baz: null })).toBe('foo=bar');
      expect(stringifyQuery({})).toBe('');
    });
  });
  
  describe('utils export', () => {
    it('should export all utilities', () => {
      expect(utils.isBrowser).toBe(isBrowser);
      expect(utils.isNode).toBe(isNode);
      expect(utils.uniqueId).toBe(uniqueId);
      expect(utils.debounce).toBe(debounce);
      expect(utils.throttle).toBe(throttle);
      expect(utils.deepClone).toBe(deepClone);
      expect(utils.deepMerge).toBe(deepMerge);
      expect(utils.getPath).toBe(getPath);
      expect(utils.setPath).toBe(setPath);
      expect(utils.camelCase).toBe(camelCase);
      expect(utils.kebabCase).toBe(kebabCase);
      expect(utils.capitalize).toBe(capitalize);
      expect(utils.last).toBe(last);
      expect(utils.chunk).toBe(chunk);
      expect(utils.shuffle).toBe(shuffle);
      expect(utils.sleep).toBe(sleep);
      expect(utils.nextTick).toBe(nextTick);
      expect(utils.timeout).toBe(timeout);
      expect(utils.parseQuery).toBe(parseQuery);
      expect(utils.stringifyQuery).toBe(stringifyQuery);
    });
  });
});