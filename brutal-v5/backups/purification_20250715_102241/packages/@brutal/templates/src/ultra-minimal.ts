/**
 * Ultra-minimal template engine - smallest possible implementation
 */

// Compact error
class E extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'TemplateError';
  }
}

// Ultra-compact expression evaluator
function ev(e: string, c: any): any {
  let p = 0;
  const len = e.length;
  
  // Skip whitespace
  function ws() {
    while (p < len && /\s/.test(e[p])) p++;
  }
  
  // Identifier
  function id(): string {
    let n = '';
    while (p < len && /[\w$]/.test(e[p])) n += e[p++];
    return n;
  }
  
  // Primary
  function pri(): any {
    ws();
    
    // Number
    if (/\d/.test(e[p])) {
      let n = '';
      while (p < len && (/\d/.test(e[p]) || e[p] === '.')) n += e[p++];
      return +n;
    }
    
    // String
    if (e[p] === '"' || e[p] === "'") {
      const q = e[p++];
      let s = '';
      while (p < len && e[p] !== q) {
        if (e[p] === '\\') p++;
        s += e[p++];
      }
      p++;
      return s;
    }
    
    // Identifier/literal
    if (/[a-zA-Z_$]/.test(e[p])) {
      const i = id();
      if (i === 'true') return true;
      if (i === 'false') return false;
      if (i === 'null') return null;
      return c[i];
    }
    
    // Parentheses
    if (e[p] === '(') {
      p++;
      const v = ter();
      ws();
      p++; // )
      return v;
    }
    
    throw new E('Bad token');
  }
  
  // Postfix
  function post(): any {
    let v = pri();
    
    while (p < len) {
      ws();
      if (e[p] === '.') {
        p++;
        v = v?.[id()];
      } else if (e[p] === '[') {
        p++;
        const i = ter();
        ws();
        p++; // ]
        v = v?.[i];
      } else if (e[p] === '(') {
        p++;
        const a = [];
        ws();
        if (e[p] !== ')') {
          do {
            a.push(ter());
            ws();
          } while (e[p] === ',' && ++p);
        }
        p++; // )
        v = v(...a);
      } else break;
    }
    
    return v;
  }
  
  // Unary
  function un(): any {
    ws();
    if (e[p] === '!') {
      p++;
      return !un();
    }
    if (e[p] === '-') {
      p++;
      return -un();
    }
    return post();
  }
  
  // Multiplicative
  function mul(): any {
    let v = un();
    while (p < len && /[*/%]/.test(e[p])) {
      const o = e[p++];
      const r = un();
      v = o === '*' ? v * r : o === '/' ? v / r : v % r;
    }
    return v;
  }
  
  // Additive
  function add(): any {
    let v = mul();
    while (p < len && /[+-]/.test(e[p])) {
      const o = e[p++];
      v = o === '+' ? v + mul() : v - mul();
    }
    return v;
  }
  
  // Relational
  function rel(): any {
    let v = add();
    ws();
    if (p < len) {
      if (e[p] === '<') {
        p++;
        return e[p] === '=' ? (p++, v <= add()) : v < add();
      }
      if (e[p] === '>') {
        p++;
        return e[p] === '=' ? (p++, v >= add()) : v > add();
      }
    }
    return v;
  }
  
  // Equality
  function eq(): any {
    let v = rel();
    ws();
    if (p < len - 1) {
      if (e[p] === '=' && e[p + 1] === '=') {
        p += 2;
        return e[p] === '=' ? (p++, v === rel()) : v == rel();
      }
      if (e[p] === '!' && e[p + 1] === '=') {
        p += 2;
        return e[p] === '=' ? (p++, v !== rel()) : v != rel();
      }
    }
    return v;
  }
  
  // Logical AND
  function and(): any {
    let v = eq();
    while (p < len - 1 && e[p] === '&' && e[p + 1] === '&') {
      p += 2;
      v = v && eq();
    }
    return v;
  }
  
  // Logical OR
  function or(): any {
    let v = and();
    while (p < len - 1 && e[p] === '|' && e[p + 1] === '|') {
      p += 2;
      v = v || and();
    }
    return v;
  }
  
  // Ternary
  function ter(): any {
    let v = or();
    ws();
    if (p < len && e[p] === '?') {
      p++;
      const t = ter();
      ws();
      p++; // :
      return v ? t : ter();
    }
    return v;
  }
  
  return ter();
}

// HTML escape
function esc(v: any): string {
  const s = v == null ? '' : String(v);
  return s.replace(/[&<>"']/g, m => 
    m === '&' ? '&amp;' : 
    m === '<' ? '&lt;' : 
    m === '>' ? '&gt;' : 
    m === '"' ? '&quot;' : '&#39;'
  );
}

// Compile template
export function compile(t: string): (c: any) => string {
  let f = 'let o="",x,y,i,j,n;';
  let p = 0;
  
  while (p < t.length) {
    const s = t.indexOf('{{', p);
    
    if (s === -1) {
      if (p < t.length) {
        f += `o+=${JSON.stringify(t.slice(p))};`;
      }
      break;
    }
    
    if (s > p) {
      f += `o+=${JSON.stringify(t.slice(p, s))};`;
    }
    
    const e = t.indexOf('}}', s + 2);
    if (e === -1) throw new E('No }}');
    
    const x = t.slice(s + 2, e).trim();
    
    // Control structures
    if (x[0] === '#') {
      if (x.startsWith('#if ')) {
        const c = x.slice(4);
        const r = pif(t, e + 2);
        f += `if(ev(${JSON.stringify(c)},c)){${r.b}}`;
        if (r.e) f += `else{${r.e}}`;
        p = r.p;
        continue;
      }
      
      if (x.startsWith('#for ')) {
        const m = x.slice(5).match(/^(\w+)\s+in\s+(.+)$/);
        if (!m) throw new E('Bad for');
        const [, v, it] = m;
        const r = pbl(t, e + 2, '/for');
        f += `i=ev(${JSON.stringify(it)},c);`;
        f += `if(i&&i[Symbol.iterator])for(let ${v} of i){`;
        f += `x=Object.create(c);x.${v}=${v};c=x;`;
        f += r.b;
        f += `c=Object.getPrototypeOf(c);}`;
        p = r.p;
        continue;
      }
      
      if (x.startsWith('#each ')) {
        const m = x.slice(6).match(/^(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
        if (!m) throw new E('Bad each');
        const [, v, k = 'index', it] = m;
        const r = pbl(t, e + 2, '/each');
        f += `j=ev(${JSON.stringify(it)},c);`;
        f += `if(j){`;
        f += `n=Array.isArray(j)?j.map((v,i)=>[i,v]):Object.entries(j);`;
        f += `for(let[${k},${v}]of n){`;
        f += `y=Object.create(c);y.${k}=${k};y.${v}=${v};c=y;`;
        f += r.b;
        f += `c=Object.getPrototypeOf(c);}}`;
        p = r.p;
        continue;
      }
    }
    
    // Expression
    f += `o+=esc(ev(${JSON.stringify(x)},c));`;
    p = e + 2;
  }
  
  f += 'return o;';
  
  return new Function('ev', 'esc', `return function(c){${f}}`)(ev, esc) as (c: any) => string;
}

// Parse block
function pbl(t: string, s: number, tag: string): { b: string; p: number } {
  const m = `{{${tag}}}`;
  const e = t.indexOf(m, s);
  if (e === -1) throw new E(`No ${m}`);
  
  const i = compile(t.slice(s, e)).toString();
  const b = i.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
  
  return { b, p: e + m.length };
}

// Parse if
function pif(t: string, s: number): { b: string; e?: string; p: number } {
  let p = s;
  let d = 1;
  let ep = -1;
  
  while (p < t.length && d > 0) {
    const n = t.indexOf('{{', p);
    if (n === -1) throw new E('No /if');
    
    const e = t.indexOf('}}', n + 2);
    if (e === -1) throw new E('No }}');
    
    const tag = t.slice(n + 2, e).trim();
    
    if (tag.startsWith('#if ')) d++;
    else if (tag === '/if') {
      d--;
      if (d === 0) {
        const be = ep !== -1 ? ep : n;
        const bi = compile(t.slice(s, be)).toString();
        const b = bi.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
        
        let eb: string | undefined;
        if (ep !== -1) {
          const ei = compile(t.slice(ep + 9, n)).toString();
          eb = ei.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
        }
        
        return { b, e: eb, p: e + 2 };
      }
    } else if (d === 1 && tag === '#else') {
      ep = n;
    }
    
    p = e + 2;
  }
  
  throw new E('No /if');
}

// Render helper
export function render(t: string, c: any = {}): string {
  return compile(t)(c);
}

// Export error type
export { E as TemplateError };