/**
 * Ultra-minimal state implementation
 */

// Type aliases
type S = Record<string, any>;
type L<T> = (s: T, p: T) => void;
type F<T> = T | Partial<T> | ((s: T) => T | Partial<T>);

// Store API
interface A<T> {
  g(): T;
  s(p: F<T>): void;
  u(l: L<T>): () => void;
  d(): void;
}

// Create store
export const c = <T extends S>(i: T | (() => T)): A<T> & T => {
  let t: T = typeof i === 'function' ? i() : i;
  const l = new Set<L<T>>();
  
  const a: A<T> = {
    g: () => t,
    s: (p) => {
      const n = typeof p === 'function' ? p(t) : p;
      const o = t;
      const isPartial = n != null && typeof n === 'object' && !Array.isArray(n);
      const newState = isPartial ? Object.assign({}, t, n) : n;
      
      // Deep compare for objects, shallow for primitives
      let changed = false;
      if (isPartial) {
        for (const k in n) {
          if (!Object.is(t[k], n[k])) {
            changed = true;
            break;
          }
        }
      } else {
        changed = !Object.is(newState, t);
      }
      
      if (!changed) return;
      
      t = newState as T;
      l.forEach(f => f(t, o));
    },
    u: (f) => {
      l.add(f);
      return () => l.delete(f);
    },
    d: () => l.clear()
  };
  
  return new Proxy(a as A<T> & T, {
    get(_, k: string | symbol) {
      return k in a ? a[k as keyof A<T>] : a.g()[k as keyof T];
    },
    set(_, k: string | symbol, v) {
      if (k in a) {
        console.warn(`Cannot overwrite store method: ${String(k)}`);
        return false;
      }
      a.s({ [k]: v } as Partial<T>);
      return true;
    }
  });
};

// Shallow equal
export const h = <T>(a: T, b: T): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || !a || typeof b !== 'object' || !b) return false;
  const k = Object.keys(a);
  if (k.length !== Object.keys(b).length) return false;
  for (const i of k) {
    if (!Object.is(a[i as keyof T], b[i as keyof T])) return false;
  }
  return true;
};

// Selector with state memoization
export const l = <T, U>(s: (t: T) => U, e = Object.is) => {
  let lastState: T | undefined;
  let lastResult: U | undefined;
  let hasResult = false;
  
  return (t: T): U => {
    // If state hasn't changed (shallow), return memoized result
    if (hasResult && lastState && h(lastState, t)) {
      return lastResult!;
    }
    
    // Compute new result
    const n = s(t);
    
    // If custom equality says result is same, return old reference
    if (hasResult && e(lastResult!, n)) {
      lastState = t;
      return lastResult!;
    }
    
    // Store new state and result
    lastState = t;
    lastResult = n;
    hasResult = true;
    return n;
  };
};

// Devtools
export const d = <T>(a: A<T>, n = 'Store') => {
  if (typeof window === 'undefined' || !(window as any).__REDUX_DEVTOOLS_EXTENSION__) return;
  try {
    const e = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: n });
    e.init(a.g());
    return a.u(s => e.send('UPDATE', s));
  } catch {
    return;
  }
};

// Persist  
export const p = <T>(a: A<T>, k: string, s?: any) => {
  // Use provided storage or default to localStorage if available
  const storage = s || (typeof window !== 'undefined' ? (window as any).localStorage : null);
  
  if (!storage) return () => {};
  
  // Load persisted state on init
  try {
    const d = storage.getItem(k);
    if (d) {
      const parsed = JSON.parse(d);
      a.s(parsed);
    }
  } catch {}
  
  // Save current state immediately
  try {
    storage.setItem(k, JSON.stringify(a.g()));
  } catch {}
  
  // Subscribe to changes
  return a.u(t => {
    try { storage.setItem(k, JSON.stringify(t)); } catch {}
  });
};