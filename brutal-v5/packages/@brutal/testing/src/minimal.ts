/**
 * Ultra-minimal testing implementation
 */

// Types
type T = () => void | Promise<void>; // Test function
type S = { n: string; t: T[] }; // Suite
type R = { p: number; f: number; e: Error[] }; // Result
type A = (v: any, m?: string) => void; // Assertion

// Deep equal
const d = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const k = Object.keys(a);
  if (k.length !== Object.keys(b).length) return false;
  return k.every(x => d(a[x], b[x]));
};

// Test runner
const r = () => {
  const s: S[] = [];
  let c: S | null = null;
  let o: R = { p: 0, f: 0, e: [] };
  
  return {
    // Define suite
    s: (name: string, f: () => void) => {
      c = { n: name, t: [] };
      s.push(c);
      f();
      c = null;
    },
    // Define test
    t: (n: string, f: T) => {
      const t = c || { n: 'default', t: [] };
      t.t.push(async () => {
        try {
          await f();
          o.p++;
        } catch (e) {
          o.f++;
          o.e.push(e as Error);
          throw e;
        }
      });
      if (!c && !s.includes(t)) s.push(t);
    },
    // Run all tests
    r: async () => {
      o = { p: 0, f: 0, e: [] };
      for (const suite of s) {
        for (const f of suite.t) {
          try {
            await f();
          } catch (e) {
            console.error(`✗ ${suite.n}:`, (e as Error).message);
          }
        }
      }
      return o;
    },
    // Clear
    c: () => {
      s.length = 0;
      c = null;
      o = { p: 0, f: 0, e: [] };
    }
  };
};

// Assertions
const a: Record<string, A> = {
  // Equal (deep)
  e: (a: any, b: any, m?: string) => {
    if (!d(a, b)) throw new Error(m || `Expected ${JSON.stringify(a)} to equal ${JSON.stringify(b)}`);
  },
  // Strict equal
  i: (a: any, b: any, m?: string) => {
    if (a !== b) throw new Error(m || `Expected ${a} to be ${b}`);
  },
  // Truthy
  o: (a: any, m?: string) => {
    if (!a) throw new Error(m || `Expected ${a} to be truthy`);
  },
  // Fail
  f: (m?: string) => {
    throw new Error(m || 'Test failed');
  },
  // Throws
  t: async (f: () => any, e?: RegExp | string, m?: string) => {
    try {
      await f();
      throw new Error(m || 'Expected to throw');
    } catch (err: any) {
      if (e && !err.message.match(e)) {
        throw new Error(m || `Expected error matching ${e}, got: ${err.message}`);
      }
    }
  }
};

// Mocking
const m = () => {
  const c: Array<{ a: any[]; r?: any; t?: any }> = []; // calls
  const f: any = (...a: any[]) => {
    const l = c[c.length - 1];
    const r = l?.r !== undefined ? l.r : undefined;
    c.push({ a, r });
    if (l?.t) throw l.t;
    return r;
  };
  
  // Add methods
  f.c = c; // calls
  f.r = (v: any) => { c.push({ a: [], r: v }); return f; }; // returns
  f.t = (e: any) => { c.push({ a: [], t: e }); return f; }; // throws
  f.w = (n: number) => c.filter((_, i) => i === n)[0]; // with call
  f.l = () => c[c.length - 1]; // last call
  f.s = () => c.length; // size
  f.x = () => { c.length = 0; }; // reset
  
  return f;
};

// Spy
const p = (o: any, n: string) => {
  const g = o[n];
  const s = m();
  o[n] = (...a: any[]) => {
    const r = g.apply(o, a);
    s(...a);
    s.r(r);
    return r;
  };
  o[n].restore = () => { o[n] = g; };
  return s;
};

// DOM helpers
const o = {
  // Render
  r: (h: string) => {
    const d = document.createElement('div');
    d.innerHTML = h;
    document.body.appendChild(d);
    return d;
  },
  // Find
  f: (s: string, e?: Element) => (e || document).querySelector(s),
  // Find all
  a: (s: string, e?: Element) => Array.from((e || document).querySelectorAll(s)),
  // Fire event
  e: (e: Element, t: string, d?: any) => {
    const v = new CustomEvent(t, { detail: d, bubbles: true });
    e.dispatchEvent(v);
  },
  // Cleanup
  c: () => {
    document.body.innerHTML = '';
  }
};

// Async utilities
const u = {
  // Wait
  w: (ms: number) => new Promise(r => setTimeout(r, ms)),
  // Wait for condition
  f: async (f: () => boolean, t = 1000, i = 10) => {
    const e = Date.now() + t;
    while (!f() && Date.now() < e) {
      await u.w(i);
    }
    if (!f()) throw new Error('Timeout waiting for condition');
  },
  // Flush promises
  p: () => new Promise(r => setImmediate ? setImmediate(r) : setTimeout(r, 0))
};

// Create runner instance
const runner = r();

// Export everything
export const test = runner.t;
export const suite = runner.s;
export const run = runner.r;
export const clear = runner.c;
export const assert = a;
export const mock = m;
export const spy = p;
export const dom = o;
export const async = u;