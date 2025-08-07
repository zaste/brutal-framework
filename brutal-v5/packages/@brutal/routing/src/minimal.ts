/**
 * Ultra-minimal routing implementation
 */

// Types
type P = Record<string, string>; // Params
type Q = Record<string, string | string[]>; // Query
type L = { p: string; q: Q; h: string; r?: R }; // Location
type R = { p: string; c?: any; n?: string; g?: G[]; m?: any }; // Route
type G = (t: L, f: L, n: N) => void; // Guard
type N = (a?: any) => void; // Next
type H = (p: string) => void; // History listener

// Parse path
const pp = (s: string) => {
  let p = s, q = '', h = '';
  const hi = p.indexOf('#');
  if (hi >= 0) { h = p.slice(hi); p = p.slice(0, hi); }
  const qi = p.indexOf('?');
  if (qi >= 0) { q = p.slice(qi + 1); p = p.slice(0, qi); }
  return { p, q: pq(q), h };
};

// Parse query
const pq = (s: string): Q => {
  const r: Q = {};
  if (!s) return r;
  s.split('&').forEach(p => {
    const [k, v = ''] = p.split('=');
    if (!k) return;
    const dk = decodeURIComponent(k);
    const dv = decodeURIComponent(v);
    if (r[dk]) {
      r[dk] = Array.isArray(r[dk]) ? [...r[dk] as string[], dv] : [r[dk] as string, dv];
    } else {
      r[dk] = dv;
    }
  });
  return r;
};

// Compile route
const cr = (p: string) => {
  const k: string[] = [];
  const r = new RegExp('^' + p
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/:(\w+)/g, (_, n) => { k.push(n); return '([^/]+)'; })
    .replace(/\*/g, '(.*)') + '$');
  return { r, k };
};

// Match route
const mr = (p: string, routes: R[]): { r: R; p: P } | null => {
  for (const route of routes) {
    const { r: regex, k: keys } = cr(route.p);
    const m = p.match(regex);
    if (m) {
      const params: P = {};
      keys.forEach((k, i) => { params[k] = m[i + 1] || ''; });
      return { r: route, p: params };
    }
  }
  return null;
};

// History
const ch = (m: 'h' | 'x' = 'h') => {
  const l = new Set<H>();
  let c = m === 'x' ? location.hash.slice(1) || '/' : location.pathname;
  
  const n = (p: string) => {
    c = p;
    l.forEach(f => f(p));
  };
  
  if (m === 'x') {
    window.addEventListener('hashchange', () => n(location.hash.slice(1) || '/'));
  } else {
    window.addEventListener('popstate', () => n(location.pathname));
  }
  
  return {
    c: () => c,
    p: (p: string) => {
      if (m === 'x') {
        location.hash = p;
      } else {
        history.pushState(null, '', p);
      }
      n(p);
    },
    r: (p: string) => {
      if (m === 'x') {
        location.replace('#' + p);
      } else {
        history.replaceState(null, '', p);
      }
      n(p);
    },
    l: (f: H) => { l.add(f); return () => l.delete(f); }
  };
};

// Router
export const r = (o: { r: R[]; m?: 'h' | 'x' }) => {
  const h = ch(o.m);
  const bg: G[] = [];
  const ag: ((t: L, f: L) => void)[] = [];
  let cl: L = { p: '/', q: {}, h: '' };
  
  const t = (p: string, cb?: () => void) => {
    const { p: path, q, h: hash } = pp(p);
    const m = mr(path, o.r);
    
    if (!m) {
      cb?.();
      return;
    }
    
    const nl: L = { p: path, q, h: hash, r: m.r };
    
    // Run guards
    const gs = [...bg, ...(m.r.g || [])];
    let i = 0;
    
    const rg = () => {
      if (i >= gs.length) {
        const ol = cl;
        cl = nl;
        ag.forEach(f => f(nl, ol));
        cb?.();
        return;
      }
      
      const g = gs[i++];
      if (!g) {
        rg();
        return;
      }
      
      const n: N = (a?: any) => {
        if (a === false || a instanceof Error) return;
        if (typeof a === 'string') {
          t(a, cb);
          return;
        }
        rg();
      };
      
      try {
        g(nl, cl, n);
      } catch {}
    };
    
    rg();
  };
  
  // Init
  h.l(p => t(p));
  t(h.c());
  
  return {
    // Current
    c: () => cl,
    // Navigate
    p: (p: string) => new Promise<void>(r => t(p, () => { h.p(p); r(); })),
    r: (p: string) => new Promise<void>(r => t(p, () => { h.r(p); r(); })),
    g: (n: number) => history.go(n),
    b: () => history.back(),
    f: () => history.forward(),
    // Guards
    bg: (g: G) => { bg.push(g); return () => bg.splice(bg.indexOf(g), 1); },
    ag: (f: (t: L, f: L) => void) => { ag.push(f); return () => ag.splice(ag.indexOf(f), 1); }
  };
};