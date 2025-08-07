/**
 * Minimal template engine - single file implementation
 */

import type { 
  TemplateFunction, 
  TemplateContext, 
  TemplateOptions, 
  CompiledTemplate,
  FilterFunction 
} from './types.js';

class E extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'TemplateError';
  }
}

// Ultra-compact expression evaluator
function evalExpr(expr: string, ctx: any, filters: Record<string, FilterFunction> = {}): any {
  // Fast paths
  if (/^[a-zA-Z_$][\w$]*$/.test(expr)) return ctx[expr];
  
  const dot = expr.match(/^([\w$]+)\.([\w$]+)$/);
  if (dot) return ctx[dot[1]]?.[dot[2]];
  
  // Handle filters
  const parts = expr.split(/\s*\|\s*/);
  if (parts.length > 1) {
    let val = ev(parts[0], ctx);
    
    for (let i = 1; i < parts.length; i++) {
      const m = parts[i].match(/^(\w+)(?:\((.*?)\))?$/);
      if (!m) throw new E('Bad filter');
      
      const fn = filters[m[1]];
      if (!fn) throw new E(`Unknown filter: ${m[1]}`);
      
      const args = m[2] ? m[2].split(',').map(a => {
        a = a.trim();
        if (a[0] === '"' || a[0] === "'") return a.slice(1, -1);
        if (a === 'true') return true;
        if (a === 'false') return false;
        if (a === 'null') return null;
        const n = +a;
        return isNaN(n) ? ev(a, ctx) : n;
      }) : [];
      
      val = fn(val, ...args);
    }
    
    return val;
  }
  
  return ev(expr, ctx);
}

// Recursive descent expression parser/evaluator
function ev(e: string, c: any): any {
  let p = 0;
  const len = e.length;
  
  // Skip whitespace
  while (p < len && /\s/.test(e[p])) p++;
  
  // Ternary
  function ternary(): any {
    let v = or();
    while (p < len && /\s/.test(e[p])) p++;
    if (p < len && e[p] === '?') {
      p++;
      const t = ternary();
      while (p < len && /\s/.test(e[p])) p++;
      if (e[p++] !== ':') throw new E('Expected :');
      return v ? t : ternary();
    }
    return v;
  }
  
  // OR
  function or(): any {
    let v = and();
    while (p < len - 1 && e[p] === '|' && e[p + 1] === '|') {
      p += 2;
      v = v || and();
    }
    return v;
  }
  
  // AND
  function and(): any {
    let v = eq();
    while (p < len - 1 && e[p] === '&' && e[p + 1] === '&') {
      p += 2;
      v = v && eq();
    }
    return v;
  }
  
  // Equality
  function eq(): any {
    let v = rel();
    while (p < len && /\s/.test(e[p])) p++;
    if (p < len - 1) {
      if (e[p] === '=' && e[p + 1] === '=') {
        p += 2;
        const s = e[p] === '=';
        if (s) p++;
        const r = rel();
        return s ? v === r : v == r;
      }
      if (e[p] === '!' && e[p + 1] === '=') {
        p += 2;
        const s = e[p] === '=';
        if (s) p++;
        const r = rel();
        return s ? v !== r : v != r;
      }
    }
    return v;
  }
  
  // Relational
  function rel(): any {
    let v = add();
    while (p < len && /\s/.test(e[p])) p++;
    if (p < len) {
      if (e[p] === '<') {
        p++;
        if (e[p] === '=') {
          p++;
          return v <= add();
        }
        return v < add();
      }
      if (e[p] === '>') {
        p++;
        if (e[p] === '=') {
          p++;
          return v >= add();
        }
        return v > add();
      }
    }
    return v;
  }
  
  // Addition
  function add(): any {
    let v = mul();
    while (p < len && (e[p] === '+' || e[p] === '-')) {
      const op = e[p++];
      v = op === '+' ? v + mul() : v - mul();
    }
    return v;
  }
  
  // Multiplication
  function mul(): any {
    let v = unary();
    while (p < len && (e[p] === '*' || e[p] === '/' || e[p] === '%')) {
      const op = e[p++];
      const r = unary();
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  }
  
  // Unary
  function unary(): any {
    while (p < len && /\s/.test(e[p])) p++;
    if (e[p] === '!') {
      p++;
      return !unary();
    }
    if (e[p] === '-') {
      p++;
      return -unary();
    }
    return postfix();
  }
  
  // Postfix
  function postfix(): any {
    let v = primary();
    while (p < len) {
      while (p < len && /\s/.test(e[p])) p++;
      if (e[p] === '.') {
        p++;
        const prop = ident();
        v = v?.[prop];
      } else if (e[p] === '[') {
        p++;
        const idx = ternary();
        while (p < len && /\s/.test(e[p])) p++;
        if (e[p++] !== ']') throw new E('Expected ]');
        v = v?.[idx];
      } else if (e[p] === '(') {
        p++;
        const args = [];
        while (p < len && /\s/.test(e[p])) p++;
        if (e[p] !== ')') {
          do {
            args.push(ternary());
            while (p < len && /\s/.test(e[p])) p++;
          } while (e[p] === ',' && ++p);
        }
        if (e[p++] !== ')') throw new E('Expected )');
        if (typeof v !== 'function') throw new E('Not a function');
        v = v(...args);
      } else {
        break;
      }
    }
    return v;
  }
  
  // Primary
  function primary(): any {
    while (p < len && /\s/.test(e[p])) p++;
    
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
    
    // Identifier
    if (/[a-zA-Z_$]/.test(e[p])) {
      const id = ident();
      if (id === 'true') return true;
      if (id === 'false') return false;
      if (id === 'null') return null;
      if (id === 'undefined') return;
      return c[id];
    }
    
    // Parentheses
    if (e[p] === '(') {
      p++;
      const v = ternary();
      while (p < len && /\s/.test(e[p])) p++;
      if (e[p++] !== ')') throw new E('Expected )');
      return v;
    }
    
    throw new E('Unexpected token');
  }
  
  // Identifier
  function ident(): string {
    let id = '';
    while (p < len && /[\w$]/.test(e[p])) id += e[p++];
    return id;
  }
  
  return ternary();
}

// Compile template to function
export function compile(tmpl: string, opts: TemplateOptions = {}): CompiledTemplate {
  const filters = opts.filters || {};
  const esc = opts.escape !== false;
  
  // Build function body
  let code = 'var o="",x,y,i,j,n;';
  let pos = 0;
  
  while (pos < tmpl.length) {
    const start = tmpl.indexOf('{{', pos);
    
    if (start === -1) {
      if (pos < tmpl.length) {
        code += `o+=${JSON.stringify(tmpl.slice(pos))};`;
      }
      break;
    }
    
    if (start > pos) {
      code += `o+=${JSON.stringify(tmpl.slice(pos, start))};`;
    }
    
    const end = tmpl.indexOf('}}', start + 2);
    if (end === -1) throw new E('Unclosed {{');
    
    const expr = tmpl.slice(start + 2, end).trim();
    
    // Control structures
    if (expr[0] === '#') {
      if (expr.startsWith('#if ')) {
        const cond = expr.slice(4);
        const { body, elseBody, nextPos } = parseIf(tmpl, end + 2);
        code += `if(e(${JSON.stringify(cond)},c,f)){${body}}`;
        if (elseBody) code += `else{${elseBody}}`;
        pos = nextPos;
        continue;
      }
      
      if (expr.startsWith('#for ')) {
        const m = expr.slice(5).match(/^(\w+)\s+in\s+(.+)$/);
        if (!m) throw new E('Bad for');
        const [, v, iter] = m;
        const { body, nextPos } = parseBlock(tmpl, end + 2, '/for');
        code += `i=e(${JSON.stringify(iter)},c,f);`;
        code += `if(i&&i[Symbol.iterator])for(var ${v} of i){`;
        code += `x=Object.create(c);x.${v}=${v};c=x;`;
        code += body;
        code += `c=Object.getPrototypeOf(c);}`;
        pos = nextPos;
        continue;
      }
      
      if (expr.startsWith('#each ')) {
        const m = expr.slice(6).match(/^(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
        if (!m) throw new E('Bad each');
        const [, v, k = 'index', iter] = m;
        const { body, nextPos } = parseBlock(tmpl, end + 2, '/each');
        code += `j=e(${JSON.stringify(iter)},c,f);`;
        code += `if(j){`;
        code += `n=Array.isArray(j)?j.map((v,i)=>[i,v]):Object.entries(j);`;
        code += `for(var[${k},${v}]of n){`;
        code += `y=Object.create(c);y.${k}=${k};y.${v}=${v};c=y;`;
        code += body;
        code += `c=Object.getPrototypeOf(c);}}`;
        pos = nextPos;
        continue;
      }
    }
    
    // Expression
    code += esc 
      ? `o+=h(e(${JSON.stringify(expr)},c,f));`
      : `o+=e(${JSON.stringify(expr)},c,f);`;
    pos = end + 2;
  }
  
  code += 'return o;';
  
  // Create render function
  const render = Function('e', 'h', 'f', `return function(c){${code}}`)(
    (expr: string, ctx: any, flt: any) => evalExpr(expr, ctx, flt),
    (v: any) => v == null ? '' : String(v).replace(/[&<>"']/g, (m: string) => 
      m === '&' ? '&amp;' : 
      m === '<' ? '&lt;' : 
      m === '>' ? '&gt;' : 
      m === '"' ? '&quot;' : '&#39;'
    ),
    filters
  ) as TemplateFunction;
  
  return { render, source: tmpl, timestamp: Date.now() };
}

// Parse control blocks
function parseBlock(tmpl: string, start: number, endTag: string): { body: string; nextPos: number } {
  const marker = `{{${endTag}}}`;
  const end = tmpl.indexOf(marker, start);
  if (end === -1) throw new E(`Missing ${marker}`);
  
  const inner = compile(tmpl.slice(start, end)).render.toString();
  const body = inner.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
  
  return { body, nextPos: end + marker.length };
}

// Parse if blocks
function parseIf(tmpl: string, start: number): { body: string; elseBody?: string; nextPos: number } {
  let pos = start;
  let depth = 1;
  let elsePos = -1;
  
  while (pos < tmpl.length && depth > 0) {
    const next = tmpl.indexOf('{{', pos);
    if (next === -1) throw new E('Unclosed if');
    
    const end = tmpl.indexOf('}}', next + 2);
    if (end === -1) throw new E('Unclosed {{');
    
    const tag = tmpl.slice(next + 2, end).trim();
    
    if (tag.startsWith('#if ')) depth++;
    else if (tag === '/if') {
      depth--;
      if (depth === 0) {
        const bodyEnd = elsePos !== -1 ? elsePos : next;
        const bodyInner = compile(tmpl.slice(start, bodyEnd)).render.toString();
        const body = bodyInner.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
        
        let elseBody: string | undefined;
        if (elsePos !== -1) {
          const elseInner = compile(tmpl.slice(elsePos + 9, next)).render.toString();
          elseBody = elseInner.match(/\{([^}]+)\}$/)?.[1].replace('return o;', '') || '';
        }
        
        return { body, elseBody, nextPos: end + 2 };
      }
    } else if (depth === 1 && tag === '#else') {
      elsePos = next;
    }
    
    pos = end + 2;
  }
  
  throw new E('Unclosed if');
}

// Render helper
export function render(tmpl: string, ctx: TemplateContext = {}, opts?: TemplateOptions): string {
  return compile(tmpl, opts).render(ctx);
}