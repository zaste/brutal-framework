/**
 * Unified parser for expressions and templates
 */

import { TemplateError } from '../types.js';
import type { ExpressionNode } from '../types.js';
import { 
  Token, Tokenizer,
  T_EOF, T_TEXT, T_NUM, T_STR, T_ID, T_OP, T_CTRL,
  OP_DOT, OP_LPAREN, OP_RPAREN, OP_LBRACKET, OP_RBRACKET, OP_COMMA,
  OP_PLUS, OP_MINUS, OP_MUL, OP_DIV, OP_MOD,
  OP_LT, OP_GT, OP_LTE, OP_GTE, OP_EQ, OP_NEQ, OP_SEQ, OP_SNEQ,
  OP_AND, OP_OR, OP_NOT, OP_QUES, OP_COLON, OP_PIPE,
  CTRL_IF, CTRL_ELIF, CTRL_ELSE, CTRL_ENDIF,
  CTRL_FOR, CTRL_ENDFOR, CTRL_EACH, CTRL_ENDEACH, CTRL_EXPR
} from './tokenizer.js';

// AST node types for templates
export type ASTNode =
  | { t: 'txt'; v: string }
  | { t: 'exp'; v: string }
  | { t: 'if'; c: string; b: ASTNode[]; e?: ASTNode[] }
  | { t: 'for'; v: string; i: string; b: ASTNode[] }
  | { t: 'each'; v: string; k: string; i: string; b: ASTNode[] };

/**
 * Expression parser
 */
export class ExprParser {
  private tokens: Token[];
  private pos = 0;
  
  parse(expr: string): ExpressionNode {
    const tokenizer = new Tokenizer(expr);
    this.tokens = tokenizer.expr();
    this.pos = 0;
    return this.expr();
  }
  
  private expr(): ExpressionNode {
    return this.ternary();
  }
  
  private ternary(): ExpressionNode {
    let e = this.or();
    
    if (this.match(OP_QUES)) {
      const c = this.expr();
      this.consume(OP_COLON);
      const a = this.expr();
      return { type: 'conditional', test: e, consequent: c, alternate: a };
    }
    
    return e;
  }
  
  private or(): ExpressionNode {
    let e = this.and();
    
    while (this.match(OP_OR)) {
      const r = this.and();
      e = { type: 'binary', operator: '||', left: e, right: r };
    }
    
    return e;
  }
  
  private and(): ExpressionNode {
    let e = this.eq();
    
    while (this.match(OP_AND)) {
      const r = this.eq();
      e = { type: 'binary', operator: '&&', left: e, right: r };
    }
    
    return e;
  }
  
  private eq(): ExpressionNode {
    let e = this.rel();
    
    while (this.curr()?.s === OP_EQ || this.curr()?.s === OP_NEQ || 
           this.curr()?.s === OP_SEQ || this.curr()?.s === OP_SNEQ) {
      const op = this.advance().v;
      const r = this.rel();
      e = { type: 'binary', operator: op, left: e, right: r };
    }
    
    return e;
  }
  
  private rel(): ExpressionNode {
    let e = this.add();
    
    while (this.curr()?.s === OP_LT || this.curr()?.s === OP_GT ||
           this.curr()?.s === OP_LTE || this.curr()?.s === OP_GTE) {
      const op = this.advance().v;
      const r = this.add();
      e = { type: 'binary', operator: op, left: e, right: r };
    }
    
    return e;
  }
  
  private add(): ExpressionNode {
    let e = this.mul();
    
    while (this.curr()?.s === OP_PLUS || this.curr()?.s === OP_MINUS) {
      const op = this.advance().v;
      const r = this.mul();
      e = { type: 'binary', operator: op, left: e, right: r };
    }
    
    return e;
  }
  
  private mul(): ExpressionNode {
    let e = this.unary();
    
    while (this.curr()?.s === OP_MUL || this.curr()?.s === OP_DIV || this.curr()?.s === OP_MOD) {
      const op = this.advance().v;
      const r = this.unary();
      e = { type: 'binary', operator: op, left: e, right: r };
    }
    
    return e;
  }
  
  private unary(): ExpressionNode {
    if (this.match(OP_NOT) || this.match(OP_MINUS)) {
      const op = this.prev().v;
      const a = this.unary();
      return { type: 'unary', operator: op, argument: a };
    }
    
    return this.postfix();
  }
  
  private postfix(): ExpressionNode {
    let e = this.primary();
    
    while (true) {
      if (this.match(OP_DOT)) {
        const t = this.consume(T_ID);
        e = { type: 'member', object: e, property: { type: 'literal', value: t.v }, computed: false };
      } else if (this.match(OP_LBRACKET)) {
        const p = this.expr();
        this.consume(OP_RBRACKET);
        e = { type: 'member', object: e, property: p, computed: true };
      } else if (this.match(OP_LPAREN)) {
        const args: ExpressionNode[] = [];
        if (!this.check(OP_RPAREN)) {
          do {
            args.push(this.expr());
          } while (this.match(OP_COMMA));
        }
        this.consume(OP_RPAREN);
        e = { type: 'call', callee: e, arguments: args };
      } else {
        break;
      }
    }
    
    return e;
  }
  
  private primary(): ExpressionNode {
    const t = this.curr();
    
    if (t?.t === T_NUM) {
      this.advance();
      return { type: 'literal', value: parseFloat(t.v) };
    }
    
    if (t?.t === T_STR) {
      this.advance();
      return { type: 'literal', value: t.v };
    }
    
    if (t?.t === T_ID) {
      this.advance();
      // Handle keywords
      if (t.s === 1) {
        switch (t.v) {
          case 'true': return { type: 'literal', value: true };
          case 'false': return { type: 'literal', value: false };
          case 'null': return { type: 'literal', value: null };
          case 'undefined': return { type: 'literal', value: undefined };
        }
      }
      return { type: 'identifier', name: t.v };
    }
    
    if (this.match(OP_LPAREN)) {
      const e = this.expr();
      this.consume(OP_RPAREN);
      return e;
    }
    
    throw new TemplateError(`Unexpected token: ${t?.v || 'EOF'}`);
  }
  
  private match(s: number): boolean {
    if (this.check(s)) {
      this.advance();
      return true;
    }
    return false;
  }
  
  private check(s: number): boolean {
    const t = this.curr();
    return t?.s === s;
  }
  
  private consume(x: number): Token {
    const t = this.curr();
    if ((x < 10 && t?.t !== x) || (x >= 10 && t?.s !== x)) {
      throw new TemplateError('Unexpected token');
    }
    return this.advance();
  }
  
  private advance(): Token {
    return this.tokens[this.pos++];
  }
  
  private curr(): Token | undefined {
    return this.tokens[this.pos];
  }
  
  private prev(): Token {
    return this.tokens[this.pos - 1];
  }
}

/**
 * Template parser
 */
export class TmplParser {
  private tokens: Token[];
  private pos = 0;
  
  parse(tmpl: string): ASTNode[] {
    const tokenizer = new Tokenizer(tmpl);
    this.tokens = tokenizer.tmpl();
    this.pos = 0;
    return this.nodes();
  }
  
  private nodes(): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    while (this.pos < this.tokens.length) {
      const n = this.node();
      if (n) nodes.push(n);
    }
    
    return nodes;
  }
  
  private node(): ASTNode | null {
    const t = this.curr();
    if (!t) return null;
    
    if (t.t === T_TEXT) {
      this.advance();
      return { t: 'txt', v: t.v };
    }
    
    if (t.t === T_CTRL) {
      switch (t.s) {
        case CTRL_EXPR:
          this.advance();
          return { t: 'exp', v: t.v };
        case CTRL_IF:
          return this.parseIf();
        case CTRL_FOR:
          return this.parseFor();
        case CTRL_EACH:
          return this.parseEach();
      }
    }
    
    return null;
  }
  
  private parseIf(): ASTNode {
    const ifToken = this.consume(CTRL_IF);
    const body: ASTNode[] = [];
    let els: ASTNode[] | undefined;
    
    while (!this.atEnd() && !this.check(CTRL_ELIF, CTRL_ELSE, CTRL_ENDIF)) {
      const n = this.node();
      if (n) body.push(n);
    }
    
    // Handle elseif chain
    if (this.check(CTRL_ELIF)) {
      const elifs: ASTNode[] = [];
      
      while (this.match(CTRL_ELIF)) {
        const cond = this.prev().v;
        const elifBody: ASTNode[] = [];
        
        while (!this.atEnd() && !this.check(CTRL_ELIF, CTRL_ELSE, CTRL_ENDIF)) {
          const n = this.node();
          if (n) elifBody.push(n);
        }
        
        elifs.push({ t: 'if', c: cond, b: elifBody });
      }
      
      // Chain elifs
      let current: ASTNode[] | undefined;
      for (let i = elifs.length - 1; i >= 0; i--) {
        const elif = elifs[i] as any;
        elif.e = current;
        current = [elif];
      }
      els = current;
    }
    
    // Handle else
    if (this.match(CTRL_ELSE)) {
      const elseBody: ASTNode[] = [];
      
      while (!this.atEnd() && !this.check(CTRL_ENDIF)) {
        const n = this.node();
        if (n) elseBody.push(n);
      }
      
      if (els) {
        // Attach to deepest elif
        let curr = els[0] as any;
        while (curr.e && curr.e.length === 1 && curr.e[0].t === 'if') {
          curr = curr.e[0];
        }
        curr.e = elseBody;
      } else {
        els = elseBody;
      }
    }
    
    this.consume(CTRL_ENDIF);
    
    return { t: 'if', c: ifToken.v, b: body, e: els };
  }
  
  private parseFor(): ASTNode {
    const forToken = this.consume(CTRL_FOR);
    const match = forToken.v.match(/^\s*(\w+)\s+in\s+(.+)$/);
    if (!match) throw new TemplateError('Invalid for syntax');
    
    const [, variable, iterable] = match;
    const body: ASTNode[] = [];
    
    while (!this.atEnd() && !this.check(CTRL_ENDFOR)) {
      const n = this.node();
      if (n) body.push(n);
    }
    
    this.consume(CTRL_ENDFOR);
    
    return { t: 'for', v: variable, i: iterable, b: body };
  }
  
  private parseEach(): ASTNode {
    const eachToken = this.consume(CTRL_EACH);
    const match = eachToken.v.match(/^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
    if (!match) throw new TemplateError('Invalid each syntax');
    
    const [, value, key = 'index', iterable] = match;
    const body: ASTNode[] = [];
    
    while (!this.atEnd() && !this.check(CTRL_ENDEACH)) {
      const n = this.node();
      if (n) body.push(n);
    }
    
    this.consume(CTRL_ENDEACH);
    
    return { t: 'each', v: value, k: key, i: iterable, b: body };
  }
  
  private match(s: number): boolean {
    const t = this.curr();
    if (t?.s === s) {
      this.advance();
      return true;
    }
    return false;
  }
  
  private check(...types: number[]): boolean {
    const t = this.curr();
    return t ? types.includes(t.s!) : false;
  }
  
  private consume(s: number): Token {
    const t = this.curr();
    if (t?.s !== s) throw new TemplateError('Unexpected token');
    return this.advance();
  }
  
  private advance(): Token {
    return this.tokens[this.pos++];
  }
  
  private curr(): Token | undefined {
    return this.tokens[this.pos];
  }
  
  private prev(): Token {
    return this.tokens[this.pos - 1];
  }
  
  private atEnd(): boolean {
    return this.pos >= this.tokens.length;
  }
}