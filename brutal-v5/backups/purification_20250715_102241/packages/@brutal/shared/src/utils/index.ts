/**
 * Shared utilities for BRUTAL V5
 * Common helpers used across packages
 */

/**
 * Environment detection
 */
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
export const isDeno = typeof Deno !== 'undefined';
export const isWebWorker = typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope';

/**
 * Browser detection
 */
export const isChrome = isBrowser && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
export const isFirefox = isBrowser && /Firefox/.test(navigator.userAgent);
export const isSafari = isBrowser && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
export const isEdge = isBrowser && /Edg/.test(navigator.userAgent);
export const isIE = isBrowser && (/MSIE/.test(navigator.userAgent) || /Trident/.test(navigator.userAgent));

/**
 * Feature detection
 */
export const supportsPassive = (() => {
  if (!isBrowser) return false;
  let passive = false;
  try {
    const options = {
      get passive() {
        passive = true;
        return false;
      }
    };
    window.addEventListener('test', null as any, options);
    window.removeEventListener('test', null as any, options);
  } catch (e) {}
  return passive;
})();

export const supportsCustomElements = isBrowser && 'customElements' in window;
export const supportsShadowDOM = isBrowser && 'attachShadow' in Element.prototype;
export const supportsIntersectionObserver = isBrowser && 'IntersectionObserver' in window;
export const supportsResizeObserver = isBrowser && 'ResizeObserver' in window;
export const supportsMutationObserver = isBrowser && 'MutationObserver' in window;

/**
 * Performance utilities
 */
export const now = isBrowser && performance.now 
  ? () => performance.now() 
  : () => Date.now();

export const raf = isBrowser && requestAnimationFrame 
  ? requestAnimationFrame.bind(window) 
  : (cb: FrameRequestCallback) => setTimeout(cb, 16);

export const caf = isBrowser && cancelAnimationFrame 
  ? cancelAnimationFrame.bind(window) 
  : clearTimeout;

/**
 * Unique ID generation
 */
let idCounter = 0;
export const uniqueId = (prefix = 'brutal'): string => {
  return `${prefix}_${++idCounter}_${now().toString(36)}`;
};

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  const debounced = function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  } as T;
  
  (debounced as any).cancel = () => clearTimeout(timeoutId);
  
  return debounced as T & { cancel: () => void };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle = false;
  let lastFn: (() => void) | null = null;
  let lastTime = 0;
  
  const throttled = function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (!inThrottle) {
      fn.apply(this, args);
      lastTime = now;
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastFn) {
          lastFn();
          lastFn = null;
        }
      }, limit);
    } else {
      lastFn = () => fn.apply(this, args);
    }
  } as T;
  
  (throttled as any).cancel = () => {
    inThrottle = false;
    lastFn = null;
  };
  
  return throttled as T & { cancel: () => void };
}

/**
 * Deep clone
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (obj instanceof Set) return new Set(Array.from(obj).map(item => deepClone(item))) as any;
  if (obj instanceof Map) return new Map(Array.from(obj).map(([k, v]) => [deepClone(k), deepClone(v)])) as any;
  
  const clonedObj = Object.create(Object.getPrototypeOf(obj));
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Deep merge
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  
  const source = sources.shift();
  if (!source) return target;
  
  for (const key in source) {
    const value = source[key];
    if (value === undefined) continue;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {} as any;
      }
      deepMerge(target[key] as any, value as any);
    } else {
      target[key] = value as any;
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Object path utilities
 */
export function getPath(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  
  return result ?? defaultValue;
}

export function setPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let target = obj;
  
  for (const key of keys) {
    if (!(key in target) || typeof target[key] !== 'object') {
      target[key] = {};
    }
    target = target[key];
  }
  
  target[lastKey] = value;
}

/**
 * String utilities
 */
export const camelCase = (str: string): string => 
  str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

export const kebabCase = (str: string): string => 
  str.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`).replace(/^-/, '');

export const capitalize = (str: string): string => 
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Array utilities
 */
export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export const shuffle = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Promise utilities
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const nextTick = (): Promise<void> => 
  Promise.resolve();

export const timeout = <T>(promise: Promise<T>, ms: number, error?: Error): Promise<T> => {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw error || new Error(`Timeout after ${ms}ms`);
    })
  ]);
};

/**
 * URL utilities
 */
export function parseQuery(query: string): Record<string, string> {
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

export function stringifyQuery(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * Export all utilities
 */
export const utils = {
  // Environment
  isBrowser,
  isNode,
  isDeno,
  isWebWorker,
  
  // Browser detection
  isChrome,
  isFirefox,
  isSafari,
  isEdge,
  isIE,
  
  // Feature detection
  supportsPassive,
  supportsCustomElements,
  supportsShadowDOM,
  supportsIntersectionObserver,
  supportsResizeObserver,
  supportsMutationObserver,
  
  // Performance
  now,
  raf,
  caf,
  
  // Functions
  uniqueId,
  debounce,
  throttle,
  
  // Objects
  deepClone,
  deepMerge,
  getPath,
  setPath,
  
  // Strings
  camelCase,
  kebabCase,
  capitalize,
  
  // Arrays
  last,
  chunk,
  shuffle,
  
  // Promises
  sleep,
  nextTick,
  timeout,
  
  // URLs
  parseQuery,
  stringifyQuery
};

export default utils;
