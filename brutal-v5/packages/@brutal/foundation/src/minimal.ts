/**
 * Ultra-minimal foundation implementation
 */

// Types
type P = { n: string; v: string; l: boolean }; // Package info
type C = Record<string, any>; // Config
type F = () => boolean; // Feature detector
type E = (e: Error, i?: any) => void; // Error handler

// Package registry
const r = () => {
  const m = new Map<string, P>();
  return {
    r: (n: string, v: string) => m.set(n, { n, v, l: true }),
    g: (n: string) => m.get(n),
    l: (n: string) => m.get(n)?.l ?? false,
    a: () => Array.from(m.values())
  };
};

// Config loader
const c = () => {
  let o: C = {};
  return {
    l: (c: C) => { o = { ...o, ...c }; },
    g: (k: string) => {
      const p = k.split('.');
      let v: any = o;
      for (const s of p) {
        if (v == null) return;
        v = v[s];
      }
      return v;
    },
    s: (k: string, v: any) => {
      const p = k.split('.');
      const l = p.pop()!;
      let t: any = o;
      for (const s of p) {
        if (!(s in t) || typeof t[s] !== 'object') t[s] = {};
        t = t[s];
      }
      t[l] = v;
    },
    r: () => { o = {}; }
  };
};

// Polyfill strategy
const p = () => {
  const d: Map<string, F> = new Map();
  const l: Set<string> = new Set();
  
  return {
    r: (n: string, t: F) => d.set(n, t),
    c: (n: string) => {
      const t = d.get(n);
      return t ? !t() : false;
    },
    l: async (n: string, u: string) => {
      if (l.has(n) || !d.has(n)) return;
      const t = d.get(n)!;
      if (!t()) {
        l.add(n);
        const s = document.createElement('script');
        s.src = u;
        s.async = true;
        await new Promise((r, j) => {
          s.onload = r;
          s.onerror = j;
          document.head.appendChild(s);
        });
      }
    },
    n: () => Array.from(d.keys()).filter(n => {
      const t = d.get(n)!;
      return !t();
    })
  };
};

// Error handling
const e = () => {
  const h: E[] = [];
  let d = false;
  
  return {
    o: (h: E) => { h.push(h); },
    e: (e: Error, i?: any) => {
      if (d) console.error('[BRUTAL]', e, i);
      h.forEach(f => {
        try { f(e, i); } catch {}
      });
    },
    d: (v: boolean) => { d = v; }
  };
};

// Environment profiles
const v = () => {
  const p: C = {
    development: { debug: true, sourceMaps: true },
    production: { debug: false, minify: true },
    test: { debug: true, coverage: true }
  };
  
  return {
    g: (n: string) => p[n] || {},
    s: (n: string, c: C) => { p[n] = c; },
    a: (n: string, c: C) => { p[n] = { ...p[n], ...c }; }
  };
};

// Utils
const u = {
  // Deep clone
  c: (o: any): any => {
    if (o === null || typeof o !== 'object') return o;
    if (o instanceof Date) return new Date(o);
    if (o instanceof Array) return o.map(i => u.c(i));
    if (o instanceof Map) return new Map(Array.from(o.entries()).map(([k, v]) => [k, u.c(v)]));
    if (o instanceof Set) return new Set(Array.from(o).map(v => u.c(v)));
    const n: any = {};
    for (const k in o) {
      if (o.hasOwnProperty(k)) n[k] = u.c(o[k]);
    }
    return n;
  },
  // Deep merge
  m: (t: any, ...s: any[]): any => {
    if (!s.length) return t;
    const o = s.shift();
    if (t && o && typeof t === 'object' && typeof o === 'object') {
      for (const k in o) {
        if (o.hasOwnProperty(k)) {
          if (Object.prototype.toString.call(o[k]) === '[object Object]') {
            if (!t[k]) Object.assign(t, { [k]: {} });
            u.m(t[k], o[k]);
          } else {
            Object.assign(t, { [k]: o[k] });
          }
        }
      }
    }
    return u.m(t, ...s);
  },
  // Type check
  t: (v: any, t: string) => {
    switch (t) {
      case 'array': return Array.isArray(v);
      case 'null': return v === null;
      case 'undefined': return v === undefined;
      default: return typeof v === t;
    }
  },
  // Debounce
  d: (f: Function, w: number) => {
    let t: any;
    return (...a: any[]) => {
      clearTimeout(t);
      t = setTimeout(() => f(...a), w);
    };
  },
  // Throttle
  h: (f: Function, w: number) => {
    let i = false;
    return (...a: any[]) => {
      if (!i) {
        f(...a);
        i = true;
        setTimeout(() => { i = false; }, w);
      }
    };
  }
};

// Create instances
export const registry = r();
export const config = c();
export const polyfills = p();
export const errors = e();
export const env = v();
export const utils = u;

// Foundation manager
export const foundation = {
  // Initialize
  init: (o?: C) => {
    if (o) config.l(o);
    errors.d(config.g('debug') ?? false);
    registry.r('@brutal/foundation', '1.0.0');
  },
  
  // Version
  version: '1.0.0',
  
  // Exports
  registry,
  config,
  polyfills,
  errors,
  env,
  utils
};