/**
 * Core utility functions with zero dependencies
 */

// Type checking utilities
export const isObject = (v: unknown): v is Record<string, unknown> => 
  v !== null && typeof v === 'object' && !Array.isArray(v);

export const isArray = Array.isArray;
export const isFunction = (v: unknown): v is Function => typeof v === 'function';
export const isString = (v: unknown): v is string => typeof v === 'string';
export const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);
export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
export const isNull = (v: unknown): v is null => v === null;
export const isUndefined = (v: unknown): v is undefined => v === undefined;
export const isNullish = (v: unknown): v is null | undefined => v == null;
export const isDefined = <T>(v: T | undefined): v is T => v !== undefined;

// Object utilities
export const hasOwn = (obj: object, key: string | symbol): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

export const keys = Object.keys;
export const values = Object.values;
export const entries = Object.entries;
export const fromEntries = Object.fromEntries;
export const assign = Object.assign;
export const freeze = Object.freeze;

// Array utilities
export const compact = <T>(arr: (T | null | undefined)[]): T[] =>
  arr.filter((v): v is T => v != null);

export const unique = <T>(arr: T[]): T[] =>
  [...new Set(arr)];

export const flatten = <T>(arr: T[][]): T[] =>
  arr.reduce((acc, val) => acc.concat(val), []);

// Function utilities
export const noop = (): void => {};

export const once = <T extends Function>(fn: T): T => {
  let called = false;
  let result: any;
  
  return ((...args: any[]) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as any;
};

export const debounce = <T extends Function>(
  fn: T, 
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: any;
  
  const debounced = (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  
  debounced.cancel = () => clearTimeout(timeoutId);
  
  return debounced as any;
};

export const throttle = <T extends Function>(
  fn: T,
  limit: number
): T & { cancel: () => void } => {
  let inThrottle = false;
  let lastResult: any;
  let timeoutId: any;
  
  const throttled = (...args: any[]) => {
    if (!inThrottle) {
      lastResult = fn(...args);
      inThrottle = true;
      
      timeoutId = setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
  
  throttled.cancel = () => {
    clearTimeout(timeoutId);
    inThrottle = false;
  };
  
  return throttled as any;
};

// Promise utilities
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const nextTick = (): Promise<void> =>
  Promise.resolve();

// Deep clone (simple implementation)
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const cloned = {} as any;
  for (const key in obj) {
    if (hasOwn(obj as any, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Deep merge
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;
  
  const source = sources.shift();
  if (!isObject(source)) return deepMerge(target, ...sources);
  
  for (const key in source) {
    if (!hasOwn(source, key)) continue;
    
    const targetValue = target[key];
    const sourceValue = source[key];
    
    if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(targetValue as any, sourceValue);
    } else {
      target[key] = sourceValue as any;
    }
  }
  
  return deepMerge(target, ...sources);
};

// Generate unique ID
let idCounter = 0;
export const uniqueId = (prefix = ''): string =>
  `${prefix}${++idCounter}_${Date.now().toString(36)}`;

// Case conversion
export const camelCase = (str: string): string =>
  str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

export const kebabCase = (str: string): string =>
  str.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`).replace(/^-/, '');

// Export all utilities
export const utils = {
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
  
  // Object
  hasOwn,
  keys,
  values,
  entries,
  fromEntries,
  assign,
  freeze,
  deepClone,
  deepMerge,
  
  // Array
  compact,
  unique,
  flatten,
  
  // Function
  noop,
  once,
  debounce,
  throttle,
  
  // Promise
  delay,
  nextTick,
  
  // String
  uniqueId,
  camelCase,
  kebabCase
};