/**
 * Further optimizations - combine tokenizer and parser into single pass
 */

import type { ExpressionNode, TemplateContext, FilterFunction, TemplateFunction, TemplateOptions, CompiledTemplate } from '../types.js';
import { TemplateError } from '../types.js';

// Minimal expression parser using recursive descent
class ExprEval {
  private i: string;
  private p = 0;
  private f: Record<string, FilterFunction>;
  
  constructor(filters: Record<string, FilterFunction> = {}) {
    this.f = filters;
  }
  
  eval(expr: string, ctx: TemplateContext): any {
    // Fast path for simple identifiers
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expr)) {
      return ctx[expr];
    }
    
    // Fast path for simple property access
    const dotMatch = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*)$/);
    if (dotMatch) {
      const obj = ctx[dotMatch[1]];
      return obj?.[dotMatch[2]];
    }
    
    // Check for filters
    const filterIdx = expr.indexOf(' | ');
    if (filterIdx > 0) {
      const base = expr.slice(0, filterIdx);
      let val = this.parse(base, ctx);
      
      const filters = expr.slice(filterIdx + 3).split(' | ');
      for (const filterExpr of filters) {
        const match = filterExpr.match(/^(\w+)(?:\((.*?)\))?$/);
        if (!match) throw new TemplateError('Invalid filter');
        
        const [, name, args] = match;
        const fn = this.f[name];
        if (!fn) throw new TemplateError(`Unknown filter: ${name}`);
        
        const argVals = args ? args.split(',').map(a => {
          const t = a.trim();
          if (t[0] === '"' || t[0] === "'") return t.slice(1, -1);
          if (t === 'true') return true;
          if (t === 'false') return false;
          if (t === 'null') return null;
          const n = +t;
          return isNaN(n) ? this.parse(t, ctx) : n;
        }) : [];
        
        val = fn(val, ...argVals);
      }
      
      return val;
    }
    
    return this.parse(expr, ctx);
  }
  
  private parse(expr: string, ctx: TemplateContext): any {
    this.i = expr;
    this.p = 0;
    return this.ternary(ctx);
  }
  
  private ternary(ctx: TemplateContext): any {
    let e = this.or(ctx);
    
    this.ws();
    if (this.p < this.i.length && this.i[this.p] === '?') {
      this.p++;
      const c = this.ternary(ctx);
      this.ws();
      if (this.i[this.p] !== ':') throw new TemplateError('Expected :');
      this.p++;
      const a = this.ternary(ctx);
      return e ? c : a;
    }
    
    return e;
  }
  
  private or(ctx: TemplateContext): any {
    let e = this.and(ctx);
    
    while (this.ws(), this.p < this.i.length - 1 && this.i[this.p] === '|' && this.i[this.p + 1] === '|') {
      this.p += 2;
      const r = this.and(ctx);
      e = e || r;
    }
    
    return e;
  }
  
  private and(ctx: TemplateContext): any {
    let e = this.eq(ctx);
    
    while (this.ws(), this.p < this.i.length - 1 && this.i[this.p] === '&' && this.i[this.p + 1] === '&') {
      this.p += 2;
      const r = this.eq(ctx);
      e = e && r;
    }
    
    return e;
  }
  
  private eq(ctx: TemplateContext): any {
    let e = this.rel(ctx);
    
    this.ws();
    if (this.p < this.i.length - 1) {
      const c = this.i[this.p];
      const n = this.i[this.p + 1];
      
      if (c === '=' && n === '=') {
        this.p += 2;
        const strict = this.i[this.p] === '=';
        if (strict) this.p++;
        const r = this.rel(ctx);
        return strict ? e === r : e == r;
      }
      
      if (c === '!' && n === '=') {
        this.p += 2;
        const strict = this.i[this.p] === '=';
        if (strict) this.p++;
        const r = this.rel(ctx);
        return strict ? e !== r : e != r;
      }
    }
    
    return e;
  }
  
  private rel(ctx: TemplateContext): any {
    let e = this.add(ctx);
    
    this.ws();
    if (this.p < this.i.length) {
      const c = this.i[this.p];
      
      if (c === '<') {
        this.p++;
        if (this.i[this.p] === '=') {
          this.p++;
          return e <= this.add(ctx);
        }
        return e < this.add(ctx);
      }
      
      if (c === '>') {
        this.p++;
        if (this.i[this.p] === '=') {
          this.p++;
          return e >= this.add(ctx);
        }
        return e > this.add(ctx);
      }
    }
    
    return e;
  }
  
  private add(ctx: TemplateContext): any {
    let e = this.mul(ctx);
    
    while (this.ws(), this.p < this.i.length && (this.i[this.p] === '+' || this.i[this.p] === '-')) {
      const op = this.i[this.p++];
      const r = this.mul(ctx);
      e = op === '+' ? e + r : e - r;
    }
    
    return e;
  }
  
  private mul(ctx: TemplateContext): any {
    let e = this.unary(ctx);
    
    while (this.ws(), this.p < this.i.length && (this.i[this.p] === '*' || this.i[this.p] === '/' || this.i[this.p] === '%')) {
      const op = this.i[this.p++];
      const r = this.unary(ctx);
      e = op === '*' ? e * r : op === '/' ? e / r : e % r;
    }
    
    return e;
  }
  
  private unary(ctx: TemplateContext): any {
    this.ws();
    if (this.p < this.i.length) {
      if (this.i[this.p] === '!') {
        this.p++;
        return !this.unary(ctx);
      }
      
      if (this.i[this.p] === '-') {
        this.p++;
        return -this.unary(ctx);
      }
    }
    
    return this.postfix(ctx);
  }
  
  private postfix(ctx: TemplateContext): any {
    let e = this.primary(ctx);
    
    while (this.ws(), this.p < this.i.length) {
      if (this.i[this.p] === '.') {
        this.p++;
        const prop = this.ident();
        e = e?.[prop];
      } else if (this.i[this.p] === '[') {
        this.p++;
        const idx = this.ternary(ctx);
        this.ws();
        if (this.i[this.p] !== ']') throw new TemplateError('Expected ]');
        this.p++;
        e = e?.[idx];
      } else if (this.i[this.p] === '(') {
        this.p++;
        const args = [];
        
        if (this.ws(), this.i[this.p] !== ')') {
          do {
            args.push(this.ternary(ctx));
            this.ws();
          } while (this.i[this.p] === ',' && ++this.p);
        }
        
        if (this.i[this.p] !== ')') throw new TemplateError('Expected )');
        this.p++;
        
        if (typeof e !== 'function') throw new TemplateError('Not a function');
        e = e(...args);
      } else {
        break;
      }
    }
    
    return e;
  }
  
  private primary(ctx: TemplateContext): any {
    this.ws();
    
    // Numbers
    if (this.p < this.i.length && /\d/.test(this.i[this.p])) {
      let n = '';
      while (this.p < this.i.length && (/\d/.test(this.i[this.p]) || this.i[this.p] === '.')) {
        n += this.i[this.p++];
      }
      return +n;
    }
    
    // Strings
    if (this.p < this.i.length && (this.i[this.p] === '"' || this.i[this.p] === "'")) {
      const q = this.i[this.p++];
      let s = '';
      while (this.p < this.i.length && this.i[this.p] !== q) {
        if (this.i[this.p] === '\\') this.p++;
        s += this.i[this.p++];
      }
      this.p++;
      return s;
    }
    
    // Identifiers/keywords
    if (this.p < this.i.length && /[a-zA-Z_$]/.test(this.i[this.p])) {
      const id = this.ident();
      if (id === 'true') return true;
      if (id === 'false') return false;
      if (id === 'null') return null;
      if (id === 'undefined') return;
      return ctx[id];
    }
    
    // Parentheses
    if (this.p < this.i.length && this.i[this.p] === '(') {
      this.p++;
      const e = this.ternary(ctx);
      this.ws();
      if (this.i[this.p] !== ')') throw new TemplateError('Expected )');
      this.p++;
      return e;
    }
    
    throw new TemplateError('Unexpected token');
  }
  
  private ident(): string {
    let id = '';
    while (this.p < this.i.length && /[a-zA-Z0-9_$]/.test(this.i[this.p])) {
      id += this.i[this.p++];
    }
    return id;
  }
  
  private ws(): void {
    while (this.p < this.i.length && /\s/.test(this.i[this.p])) this.p++;
  }
}

// Ultra-compact template compiler
export class CompactCompiler {
  private e: ExprEval;
  private h: (v: any) => string;
  
  constructor(opts: TemplateOptions = {}) {
    this.e = new ExprEval(opts.filters);
    this.h = opts.escape !== false ? (v: any) => {
      if (v == null) return '';
      return String(v).replace(/[&<>"']/g, m => 
        m === '&' ? '&amp;' : 
        m === '<' ? '&lt;' : 
        m === '>' ? '&gt;' : 
        m === '"' ? '&quot;' : '&#39;'
      );
    } : String;
  }
  
  compile(tmpl: string): CompiledTemplate {
    const fn = this.build(tmpl);
    return { render: fn, source: tmpl, timestamp: Date.now() };
  }
  
  private build(tmpl: string): TemplateFunction {
    let code = '';
    let p = 0;
    
    while (p < tmpl.length) {
      const start = tmpl.indexOf('{{', p);
      
      if (start === -1) {
        // Rest is text
        if (p < tmpl.length) {
          code += `o+=${JSON.stringify(tmpl.slice(p))};`;
        }
        break;
      }
      
      // Add text before {{
      if (start > p) {
        code += `o+=${JSON.stringify(tmpl.slice(p, start))};`;
      }
      
      // Find closing }}
      const end = tmpl.indexOf('}}', start + 2);
      if (end === -1) throw new TemplateError('Unclosed {{');
      
      const expr = tmpl.slice(start + 2, end).trim();
      
      // Handle control structures
      if (expr[0] === '#') {
        if (expr.startsWith('#if ')) {
          const cond = expr.slice(4);
          const { body, elseBody, nextPos } = this.parseIf(tmpl, end + 2);
          code += `if(e.eval(${JSON.stringify(cond)},c)){${body}}`;
          if (elseBody) code += `else{${elseBody}}`;
          p = nextPos;
          continue;
        }
        
        if (expr.startsWith('#for ')) {
          const match = expr.slice(5).match(/^(\w+)\s+in\s+(.+)$/);
          if (!match) throw new TemplateError('Invalid for');
          const [, v, iter] = match;
          const { body, nextPos } = this.parseBlock(tmpl, end + 2, '/for');
          code += `var i=e.eval(${JSON.stringify(iter)},c);`;
          code += `if(i&&i[Symbol.iterator]){`;
          code += `for(var ${v} of i){`;
          code += `var x=Object.create(c);x.${v}=${v};c=x;`;
          code += body;
          code += `c=Object.getPrototypeOf(c);}}`;
          p = nextPos;
          continue;
        }
        
        if (expr.startsWith('#each ')) {
          const match = expr.slice(6).match(/^(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
          if (!match) throw new TemplateError('Invalid each');
          const [, v, k = 'index', iter] = match;
          const { body, nextPos } = this.parseBlock(tmpl, end + 2, '/each');
          code += `var j=e.eval(${JSON.stringify(iter)},c);`;
          code += `if(j){`;
          code += `var n=Array.isArray(j)?j.map((v,i)=>[i,v]):Object.entries(j);`;
          code += `for(var[${k},${v}]of n){`;
          code += `var y=Object.create(c);y.${k}=${k};y.${v}=${v};c=y;`;
          code += body;
          code += `c=Object.getPrototypeOf(c);}}`;
          p = nextPos;
          continue;
        }
      }
      
      // Regular expression
      code += `o+=h(e.eval(${JSON.stringify(expr)},c));`;
      p = end + 2;
    }
    
    const e = this.e;
    const h = this.h;
    
    return Function('e', 'h', `return function(c){var o="";${code}return o;}`)(e, h) as TemplateFunction;
  }
  
  private parseBlock(tmpl: string, start: number, endTag: string): { body: string, nextPos: number } {
    const endMarker = `{{${endTag}}}`;
    const end = tmpl.indexOf(endMarker, start);
    if (end === -1) throw new TemplateError(`Missing ${endMarker}`);
    
    const inner = tmpl.slice(start, end);
    const body = this.build(inner).toString().match(/var o="";(.*)return o;/)?.[1] || '';
    
    return { body, nextPos: end + endMarker.length };
  }
  
  private parseIf(tmpl: string, start: number): { body: string, elseBody?: string, nextPos: number } {
    let p = start;
    let depth = 1;
    let elsePos = -1;
    let elseIfPositions: number[] = [];
    
    // Find matching endif, tracking else/elseif
    while (p < tmpl.length && depth > 0) {
      const next = tmpl.indexOf('{{', p);
      if (next === -1) throw new TemplateError('Unclosed if');
      
      const end = tmpl.indexOf('}}', next + 2);
      if (end === -1) throw new TemplateError('Unclosed {{');
      
      const tag = tmpl.slice(next + 2, end).trim();
      
      if (tag.startsWith('#if ')) depth++;
      else if (tag === '/if') {
        depth--;
        if (depth === 0) {
          const bodyEnd = elsePos !== -1 ? elsePos : next;
          const body = this.build(tmpl.slice(start, bodyEnd)).toString().match(/var o="";(.*)return o;/)?.[1] || '';
          
          let elseBody: string | undefined;
          if (elsePos !== -1) {
            const elseEnd = next;
            const elseContent = tmpl.slice(elsePos + '{{#else}}'.length, elseEnd);
            
            // Handle elseif chain
            if (elseIfPositions.length > 0) {
              elseBody = this.buildElseIfChain(tmpl, elseIfPositions, elseEnd);
            } else {
              elseBody = this.build(elseContent).toString().match(/var o="";(.*)return o;/)?.[1] || '';
            }
          }
          
          return { body, elseBody, nextPos: end + 2 };
        }
      } else if (depth === 1) {
        if (tag === '#else') elsePos = next;
        else if (tag.startsWith('#elseif ')) elseIfPositions.push(next);
      }
      
      p = end + 2;
    }
    
    throw new TemplateError('Unclosed if');
  }
  
  private buildElseIfChain(tmpl: string, positions: number[], endPos: number): string {
    let code = '';
    
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i];
      const end = i < positions.length - 1 ? positions[i + 1] : endPos;
      
      const startTag = tmpl.indexOf('}}', start) + 2;
      const tag = tmpl.slice(start + 2, startTag - 2).trim();
      const cond = tag.slice(8); // Remove '#elseif '
      
      const body = this.build(tmpl.slice(startTag, end)).toString().match(/var o="";(.*)return o;/)?.[1] || '';
      
      code += `${i > 0 ? 'else ' : ''}if(e.eval(${JSON.stringify(cond)},c)){${body}}`;
    }
    
    return code;
  }
}

export function compileCompact(tmpl: string, opts?: TemplateOptions): CompiledTemplate {
  return new CompactCompiler(opts).compile(tmpl);
}