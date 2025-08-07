import { describe, it, expect } from '@jest/globals';
import {
  // Type checking
  isObject,
  isArray,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isNullish,
  isDefined,
  // Object utilities
  hasOwn,
  deepClone,
  deepMerge,
  // Array utilities
  compact,
  unique,
  flatten,
  // Function utilities
  noop,
  once,
  debounce,
  throttle,
  // Promise utilities
  delay,
  nextTick,
  // String utilities
  uniqueId,
  camelCase,
  kebabCase
} from './index.js';

describe('Type checking', () => {
  it('isObject should identify objects correctly', () => {
  expect(isObject({})).toBe(true);
  expect(isObject({ a: 1 })).toBe(true);
  expect(isObject([])).toBe(false);
  expect(isObject(null)).toBe(false);
  expect(isObject(undefined)).toBe(false);
  expect(isObject('string')).toBe(false);
  });

  it('isArray should identify arrays', () => {
  expect(isArray([])).toBe(true);
  expect(isArray([1, 2, 3])).toBe(true);
  expect(isArray({})).toBe(false);
  expect(isArray('string')).toBe(false);
  });

  it('type checking functions should work correctly', () => {
  expect(isFunction(() => {})).toBe(true);
  expect(isString('test')).toBe(true);
  expect(isNumber(42)).toBe(true);
  expect(isNumber(NaN)).toBe(false);
  expect(isBoolean(true)).toBe(true);
  expect(isNull(null)).toBe(true);
  expect(isUndefined(undefined)).toBe(true);
  expect(isNullish(null)).toBe(true);
  expect(isNullish(undefined)).toBe(true);
  expect(isDefined('value')).toBe(true);
  expect(isDefined(undefined)).toBe(false);
  });
});

describe('Object utilities', () => {
  it('hasOwn should check object properties', () => {
  const obj = { a: 1, b: 2 };
  expect(hasOwn(obj, 'a')).toBe(true);
  expect(hasOwn(obj, 'toString')).toBe(false);
  });

  it('deepClone should create deep copies', () => {
  const original = {
    a: 1,
    b: { c: 2, d: [3, 4] },
    e: new Date()
  };
  
  const cloned = deepClone(original);
  
  expect(cloned).toEqual(original);
  expect(cloned).not.toBe(original);
  expect(cloned.b).not.toBe(original.b);
  expect(cloned.b.d).not.toBe(original.b.d);
  expect(cloned.e.getTime()).toBe(original.e.getTime());
  });

  it('deepMerge should merge objects deeply', () => {
  const target = { a: 1, b: { c: 2 } };
  const source1 = { b: { d: 3 }, e: 4 };
  const source2 = { b: { c: 5 }, f: 6 };
  
  const result = deepMerge(target, source1, source2);
  
  expect(result).toEqual({
    a: 1,
    b: { c: 5, d: 3 },
    e: 4,
    f: 6
  });
  });
});

describe('Array utilities', () => {
  it('compact should remove null/undefined values', () => {
  expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  expect(compact([null, undefined])).toEqual([]);
  });

  it('unique should remove duplicates', () => {
  expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('flatten should flatten nested arrays', () => {
  expect(flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
  expect(flatten([[], [1], [], [2, 3]])).toEqual([1, 2, 3]);
  });
});

describe('Function utilities', () => {
  it('noop should do nothing', () => {
  expect(noop()).toBe(undefined);
  expect(() => noop()).not.toThrow();
  });

  it('once should call function only once', () => {
  let count = 0;
  const increment = once(() => ++count);
  
  expect(increment()).toBe(1);
  expect(increment()).toBe(1);
  expect(increment()).toBe(1);
  expect(count).toBe(1);
  });

  it('debounce should delay function calls', async () => {
  let count = 0;
  const increment = debounce(() => ++count, 50);
  
  increment();
  increment();
  increment();
  
  expect(count).toBe(0);
  
  await delay(60);
  expect(count).toBe(1);
  
  increment.cancel();
  });

  it('throttle should limit function calls', async () => {
  let count = 0;
  const increment = throttle(() => ++count, 50);
  
  increment();
  increment();
  increment();
  
  expect(count).toBe(1);
  
  await delay(60);
  
  increment();
  expect(count).toBe(2);
  
  increment.cancel();
  });
});

describe('Promise utilities', () => {
  it('delay should wait specified time', async () => {
  const start = Date.now();
  await delay(50);
  const duration = Date.now() - start;
  
  expect(duration).toBeGreaterThan(45);
  expect(duration).toBeLessThan(100);
  });

  it('nextTick should defer execution', async () => {
  let executed = false;
  
  nextTick().then(() => {
    executed = true;
  });
  
  expect(executed).toBe(false);
  await nextTick();
  expect(executed).toBe(true);
  });
});

describe('String utilities', () => {
  it('uniqueId should generate unique identifiers', () => {
  const id1 = uniqueId();
  const id2 = uniqueId();
  const id3 = uniqueId('prefix_');
  
  expect(id1).not.toBe(id2);
  expect(id3).toContain('prefix_');
  });

  it('camelCase should convert kebab to camel', () => {
  expect(camelCase('hello-world')).toBe('helloWorld');
  expect(camelCase('test-case-string')).toBe('testCaseString');
  expect(camelCase('simple')).toBe('simple');
  });

  it('kebabCase should convert camel to kebab', () => {
  expect(kebabCase('helloWorld')).toBe('hello-world');
  expect(kebabCase('testCaseString')).toBe('test-case-string');
  expect(kebabCase('simple')).toBe('simple');
  });
});