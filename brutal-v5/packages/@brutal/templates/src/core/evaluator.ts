/**
 * Compact expression evaluator
 */

import type { ExpressionNode, TemplateContext, FilterFunction } from '../types.js';
import { TemplateError } from '../types.js';
import { ExprParser } from './parser.js';

/**
 * Evaluate expressions with minimal overhead
 */
export class Evaluator {
  private p = new ExprParser();
  private f: Record<string, FilterFunction>;
  
  constructor(filters: Record<string, FilterFunction> = {}) {
    this.f = filters;
  }
  
  eval(expr: string, ctx: TemplateContext): any {
    // Check for filters (simple regex is faster than full parse)
    const filterMatch = expr.match(/^(.+?)\s*\|\s*(\w+)(?:\((.*?)\))?$/);
    
    if (filterMatch) {
      const [, baseExpr, filterName, argsStr] = filterMatch;
      let value = this.evalNode(this.p.parse(baseExpr), ctx);
      
      // Handle filter chain
      const filterParts = expr.split(/\s*\|\s*/);
      for (let i = 1; i < filterParts.length; i++) {
        const match = filterParts[i].match(/^(\w+)(?:\((.*?)\))?$/);
        if (!match) throw new TemplateError('Invalid filter');
        
        const [, name, args] = match;
        const filter = this.f[name];
        if (!filter) throw new TemplateError(`Unknown filter: ${name}`);
        
        const filterArgs = args ? this.parseArgs(args, ctx) : [];
        value = filter(value, ...filterArgs);
      }
      
      return value;
    }
    
    return this.evalNode(this.p.parse(expr), ctx);
  }
  
  private evalNode(n: ExpressionNode, ctx: TemplateContext): any {
    switch (n.type) {
      case 'literal':
        return n.value;
        
      case 'identifier':
        return ctx[n.name];
        
      case 'member': {
        const obj = this.evalNode(n.object, ctx);
        if (obj == null) return;
        const prop = n.computed ? this.evalNode(n.property, ctx) : (n.property as any).value;
        return obj[prop];
      }
        
      case 'call': {
        const fn = this.evalNode(n.callee, ctx);
        if (typeof fn !== 'function') throw new TemplateError('Not a function');
        const args = n.arguments.map(a => this.evalNode(a, ctx));
        return fn(...args);
      }
        
      case 'binary': {
        const op = n.operator;
        
        // Short-circuit for logical operators
        if (op === '&&' || op === '||') {
          const l = this.evalNode(n.left, ctx);
          if (op === '&&' && !l) return false;
          if (op === '||' && l) return true;
          return op === '&&' ? l && this.evalNode(n.right, ctx) : l || this.evalNode(n.right, ctx);
        }
        
        const l = this.evalNode(n.left, ctx);
        const r = this.evalNode(n.right, ctx);
        
        switch (op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return l / r;
          case '%': return l % r;
          case '<': return l < r;
          case '>': return l > r;
          case '<=': return l <= r;
          case '>=': return l >= r;
          case '==': return l == r;
          case '!=': return l != r;
          case '===': return l === r;
          case '!==': return l !== r;
          default: throw new TemplateError(`Unknown op: ${op}`);
        }
      }
        
      case 'unary': {
        const v = this.evalNode(n.argument, ctx);
        return n.operator === '!' ? !v : -v;
      }
        
      case 'conditional':
        return this.evalNode(n.test, ctx) 
          ? this.evalNode(n.consequent, ctx)
          : this.evalNode(n.alternate, ctx);
        
      default:
        throw new TemplateError('Unknown node type');
    }
  }
  
  private parseArgs(args: string, ctx: TemplateContext): any[] {
    // Simple arg parsing - handles strings, numbers, bools
    return args.split(',').map(arg => {
      const t = arg.trim();
      
      // String
      if ((t[0] === '"' || t[0] === "'") && t[0] === t[t.length - 1]) {
        return t.slice(1, -1);
      }
      
      // Boolean/null
      if (t === 'true') return true;
      if (t === 'false') return false;
      if (t === 'null') return null;
      if (t === 'undefined') return;
      
      // Number
      const n = parseFloat(t);
      if (!isNaN(n)) return n;
      
      // Expression
      return this.evalNode(this.p.parse(t), ctx);
    });
  }
}