/**
 * Ultra-minimal HTTP client implementation
 */

// Types
type C = Record<string, any>; // Config
type R<T = any> = { data: T; status: number; statusText: string; headers: Headers; config: C }; // Response
type I = { f?: (v: any) => any; r?: (e: any) => any }; // Interceptor
type T = (d: any, h?: any) => any; // Transformer

// Interceptor manager
const m = () => {
  const is: Array<I | null> = [];
  return {
    u: (f?: (v: any) => any, r?: (e: any) => any) => {
      is.push({ f, r });
      return is.length - 1;
    },
    e: (i: number) => { is[i] = null; },
    r: async (v: any, e?: boolean) => {
      for (const i of is) {
        if (!i) continue;
        try {
          v = e && i.r ? await i.r(v) : i.f ? await i.f(v) : v;
          e = false;
        } catch (err) {
          v = err;
          e = true;
        }
      }
      if (e) throw v;
      return v;
    }
  };
};

// Transform data
const t = (d: any, ts: T | T[] | undefined, h?: any) => {
  if (!ts) return d;
  const arr = Array.isArray(ts) ? ts : [ts];
  return arr.reduce((acc, fn) => fn(acc, h), d);
};

// Build URL with params
const b = (u: string, p?: C) => {
  if (!p) return u;
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      Array.isArray(v) ? v.forEach(i => s.append(k, i)) : s.append(k, v);
    }
  });
  const q = s.toString();
  return q ? `${u}${u.includes('?') ? '&' : '?'}${q}` : u;
};

// Retry logic
const rt = async (fn: () => Promise<any>, c: C): Promise<any> => {
  const { count = 0, delay = 1000, shouldRetry = () => true } = c.retry || {};
  let last;
  for (let i = 0; i <= count; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < count && shouldRetry(e, i)) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
      } else {
        throw e;
      }
    }
  }
  throw last;
};

// HTTP client
export const h = () => {
  const rq = m(); // request interceptors
  const rs = m(); // response interceptors

  const r = async <T = any>(c: C): Promise<R<T>> => {
    // Apply request interceptors
    c = await rq.r(c);

    const { 
      url = '', 
      method = 'GET', 
      headers = {}, 
      params, 
      data, 
      timeout, 
      signal,
      transformRequest,
      transformResponse 
    } = c;

    // Build URL
    const u = b(url, params);

    // Transform request data
    const td = t(data, transformRequest, headers);

    // Build fetch options
    const o: RequestInit = {
      method,
      headers: new Headers(headers),
      signal
    };

    if (td !== undefined && method !== 'GET' && method !== 'HEAD') {
      o.body = typeof td === 'string' ? td : JSON.stringify(td);
      if (!o.headers!.has('Content-Type')) {
        o.headers!.set('Content-Type', 'application/json');
      }
    }

    // Add timeout
    let ctrl: AbortController | undefined;
    if (timeout && !signal) {
      ctrl = new AbortController();
      o.signal = ctrl.signal;
      setTimeout(() => ctrl!.abort(), timeout);
    }

    // Execute request with retry
    const exec = async () => {
      const res = await fetch(u, o);
      
      // Parse response
      let d: any;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        d = await res.json();
      } else if (ct.includes('text')) {
        d = await res.text();
      } else {
        d = await res.blob();
      }

      // Transform response
      d = t(d, transformResponse, res.headers);

      const response: R<T> = {
        data: d,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        config: c
      };

      if (!res.ok) {
        const e: any = new Error(`Request failed with status ${res.status}`);
        e.response = response;
        throw e;
      }

      return response;
    };

    // Execute with retry if configured
    const result = c.retry ? await rt(exec, c) : await exec();

    // Apply response interceptors
    return await rs.r(result);
  };

  // HTTP methods
  const g = <T = any>(u: string, c?: C) => r<T>({ ...c, url: u, method: 'GET' });
  const p = <T = any>(u: string, d?: any, c?: C) => r<T>({ ...c, url: u, method: 'POST', data: d });
  const u = <T = any>(u: string, d?: any, c?: C) => r<T>({ ...c, url: u, method: 'PUT', data: d });
  const a = <T = any>(u: string, d?: any, c?: C) => r<T>({ ...c, url: u, method: 'PATCH', data: d });
  const d = <T = any>(u: string, c?: C) => r<T>({ ...c, url: u, method: 'DELETE' });
  const hd = <T = any>(u: string, c?: C) => r<T>({ ...c, url: u, method: 'HEAD' });
  const o = <T = any>(u: string, c?: C) => r<T>({ ...c, url: u, method: 'OPTIONS' });

  return {
    get: g,
    post: p,
    put: u,
    patch: a,
    delete: d,
    head: hd,
    options: o,
    request: r,
    interceptors: {
      request: { use: rq.u, eject: rq.e },
      response: { use: rs.u, eject: rs.e }
    }
  };
};