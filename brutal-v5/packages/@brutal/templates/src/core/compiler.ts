/**
 * Compact template compiler
 */

import type { TemplateFunction, TemplateOptions, CompiledTemplate } from '../types.js';
import { Evaluator } from './evaluator.js';
import { TmplParser, type ASTNode } from './parser.js';

/**
 * Compile templates to optimized functions
 */
export class Compiler {
  private e: Evaluator;
  private esc: boolean;
  
  constructor(opts: TemplateOptions = {}) {
    this.e = new Evaluator(opts.filters);
    this.esc = opts.escape !== false;
  }
  
  compile(tmpl: string): CompiledTemplate {
    const parser = new TmplParser();
    const ast = parser.parse(tmpl);
    
    return {
      render: this.gen(ast),
      source: tmpl,
      timestamp: Date.now()
    };
  }
  
  private gen(ast: ASTNode[]): TemplateFunction {
    const code = this.code(ast);
    const e = this.e;
    const esc = this.esc ? this.escape : (v: any) => String(v);
    
    // Use Function constructor more efficiently
    return Function('e', 'h', 'return function(c){' + code + '}')(e, esc) as TemplateFunction;
  }
  
  private code(nodes: ASTNode[]): string {
    let code = 'var o="";';
    
    for (const n of nodes) {
      code += this.node(n);
    }
    
    return code + 'return o;';
  }
  
  private node(n: ASTNode): string {
    switch (n.t) {
      case 'txt':
        return `o+=${JSON.stringify(n.v)};`;
        
      case 'exp':
        return `o+=h(e.eval(${JSON.stringify(n.v)},c));`;
        
      case 'if': {
        let code = `if(e.eval(${JSON.stringify(n.c)},c)){`;
        code += n.b.map(x => this.node(x)).join('');
        code += '}';
        
        if (n.e) {
          code += 'else{';
          code += n.e.map(x => this.node(x)).join('');
          code += '}';
        }
        
        return code;
      }
        
      case 'for': {
        const it = `e.eval(${JSON.stringify(n.i)},c)`;
        let code = `var i=${it};`;
        code += `if(i&&typeof i[Symbol.iterator]==='function'){`;
        code += `for(var ${n.v} of i){`;
        code += `var x=Object.create(c);`;
        code += `x.${n.v}=${n.v};`;
        code += `c=x;`;
        code += n.b.map(x => this.node(x)).join('');
        code += `c=Object.getPrototypeOf(c);`;
        code += '}}';
        
        return code;
      }
        
      case 'each': {
        const obj = `e.eval(${JSON.stringify(n.i)},c)`;
        let code = `var j=${obj};`;
        code += `if(j){`;
        code += `var n=Array.isArray(j)?j.map((v,i)=>[i,v]):Object.entries(j);`;
        code += `for(var[${n.k},${n.v}]of n){`;
        code += `var y=Object.create(c);`;
        code += `y.${n.k}=${n.k};`;
        code += `y.${n.v}=${n.v};`;
        code += `c=y;`;
        code += n.b.map(x => this.node(x)).join('');
        code += `c=Object.getPrototypeOf(c);`;
        code += '}}';
        
        return code;
      }
    }
    
    return '';
  }
  
  private escape(v: any): string {
    if (v == null) return '';
    const s = String(v);
    return s.replace(/[&<>"']/g, m => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }
}

/**
 * Quick compile function
 */
export function compile(tmpl: string, opts?: TemplateOptions): CompiledTemplate {
  return new Compiler(opts).compile(tmpl);
}