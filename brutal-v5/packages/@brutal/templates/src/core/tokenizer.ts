/**
 * Unified tokenizer for both expressions and templates
 */

import { TemplateError } from '../types.js';

// Token types as constants to save space
export const T_EOF = 0;
export const T_TEXT = 1;
export const T_NUM = 2;
export const T_STR = 3;
export const T_ID = 4;
export const T_OP = 5;
export const T_CTRL = 6;

export interface Token {
  t: number; // type
  v: string; // value
  s?: number; // subtype for operators/control
}

// Operator subtypes
export const OP_DOT = 1;
export const OP_LPAREN = 2;
export const OP_RPAREN = 3;
export const OP_LBRACKET = 4;
export const OP_RBRACKET = 5;
export const OP_COMMA = 6;
export const OP_PLUS = 7;
export const OP_MINUS = 8;
export const OP_MUL = 9;
export const OP_DIV = 10;
export const OP_MOD = 11;
export const OP_LT = 12;
export const OP_GT = 13;
export const OP_LTE = 14;
export const OP_GTE = 15;
export const OP_EQ = 16;
export const OP_NEQ = 17;
export const OP_SEQ = 18;
export const OP_SNEQ = 19;
export const OP_AND = 20;
export const OP_OR = 21;
export const OP_NOT = 22;
export const OP_QUES = 23;
export const OP_COLON = 24;
export const OP_PIPE = 25;

// Control flow subtypes
export const CTRL_IF = 1;
export const CTRL_ELIF = 2;
export const CTRL_ELSE = 3;
export const CTRL_ENDIF = 4;
export const CTRL_FOR = 5;
export const CTRL_ENDFOR = 6;
export const CTRL_EACH = 7;
export const CTRL_ENDEACH = 8;
export const CTRL_EXPR = 9;

/**
 * Unified tokenizer for expressions and templates
 */
export class Tokenizer {
  private p = 0; // position
  private i: string; // input
  
  constructor(input: string) {
    this.i = input;
  }
  
  /**
   * Tokenize expression
   */
  expr(): Token[] {
    const tokens: Token[] = [];
    this.p = 0;
    
    while (this.p < this.i.length) {
      this.ws();
      if (this.p >= this.i.length) break;
      
      const t = this.next();
      if (t) tokens.push(t);
    }
    
    tokens.push({ t: T_EOF, v: '' });
    return tokens;
  }
  
  /**
   * Tokenize template
   */
  tmpl(): Token[] {
    const tokens: Token[] = [];
    this.p = 0;
    
    while (this.p < this.i.length) {
      if (this.at('{{')) {
        const t = this.ctrl();
        if (t) tokens.push(t);
      } else {
        const text = this.text();
        if (text.v) tokens.push(text);
      }
    }
    
    return tokens;
  }
  
  private next(): Token | null {
    const c = this.i[this.p];
    
    // Numbers
    if (/\d/.test(c)) return this.num();
    
    // Strings
    if (c === '"' || c === "'") return this.str();
    
    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(c)) return this.id();
    
    // Operators
    return this.op();
  }
  
  private num(): Token {
    let v = '';
    while (this.p < this.i.length && (/\d/.test(this.i[this.p]) || this.i[this.p] === '.')) {
      v += this.i[this.p++];
    }
    return { t: T_NUM, v };
  }
  
  private str(): Token {
    const q = this.i[this.p++];
    let v = '';
    
    while (this.p < this.i.length && this.i[this.p] !== q) {
      if (this.i[this.p] === '\\' && this.p + 1 < this.i.length) {
        this.p++;
        v += this.i[this.p++];
      } else {
        v += this.i[this.p++];
      }
    }
    
    if (this.i[this.p] !== q) throw new TemplateError('Unterminated string');
    this.p++;
    
    return { t: T_STR, v };
  }
  
  private id(): Token {
    let v = '';
    while (this.p < this.i.length && /[a-zA-Z0-9_$]/.test(this.i[this.p])) {
      v += this.i[this.p++];
    }
    
    // Check keywords
    if (v === 'true' || v === 'false' || v === 'null' || v === 'undefined') {
      return { t: T_ID, v, s: 1 }; // s=1 for keywords
    }
    
    return { t: T_ID, v };
  }
  
  private op(): Token | null {
    const c = this.i[this.p];
    const n = this.i[this.p + 1];
    
    // Two-char operators
    if (c === '!' && n === '=') {
      this.p += 2;
      if (this.i[this.p] === '=') {
        this.p++;
        return { t: T_OP, v: '!==', s: OP_SNEQ };
      }
      return { t: T_OP, v: '!=', s: OP_NEQ };
    }
    
    if (c === '=' && n === '=') {
      this.p += 2;
      if (this.i[this.p] === '=') {
        this.p++;
        return { t: T_OP, v: '===', s: OP_SEQ };
      }
      return { t: T_OP, v: '==', s: OP_EQ };
    }
    
    if (c === '<' && n === '=') {
      this.p += 2;
      return { t: T_OP, v: '<=', s: OP_LTE };
    }
    
    if (c === '>' && n === '=') {
      this.p += 2;
      return { t: T_OP, v: '>=', s: OP_GTE };
    }
    
    if (c === '&' && n === '&') {
      this.p += 2;
      return { t: T_OP, v: '&&', s: OP_AND };
    }
    
    if (c === '|' && n === '|') {
      this.p += 2;
      return { t: T_OP, v: '||', s: OP_OR };
    }
    
    // Single-char operators
    this.p++;
    switch (c) {
      case '.': return { t: T_OP, v: c, s: OP_DOT };
      case '(': return { t: T_OP, v: c, s: OP_LPAREN };
      case ')': return { t: T_OP, v: c, s: OP_RPAREN };
      case '[': return { t: T_OP, v: c, s: OP_LBRACKET };
      case ']': return { t: T_OP, v: c, s: OP_RBRACKET };
      case ',': return { t: T_OP, v: c, s: OP_COMMA };
      case '+': return { t: T_OP, v: c, s: OP_PLUS };
      case '-': return { t: T_OP, v: c, s: OP_MINUS };
      case '*': return { t: T_OP, v: c, s: OP_MUL };
      case '/': return { t: T_OP, v: c, s: OP_DIV };
      case '%': return { t: T_OP, v: c, s: OP_MOD };
      case '<': return { t: T_OP, v: c, s: OP_LT };
      case '>': return { t: T_OP, v: c, s: OP_GT };
      case '!': return { t: T_OP, v: c, s: OP_NOT };
      case '?': return { t: T_OP, v: c, s: OP_QUES };
      case ':': return { t: T_OP, v: c, s: OP_COLON };
      case '|': return { t: T_OP, v: c, s: OP_PIPE };
      case '=': throw new TemplateError('Unexpected =');
      default:
        this.p--;
        throw new TemplateError(`Unexpected character: ${c}`);
    }
  }
  
  private text(): Token {
    let v = '';
    while (this.p < this.i.length && !this.at('{{')) {
      v += this.i[this.p++];
    }
    return { t: T_TEXT, v };
  }
  
  private ctrl(): Token | null {
    this.p += 2; // Skip {{
    this.ws();
    
    if (this.at('#if')) {
      this.p += 3;
      this.ws();
      const v = this.until('}}');
      this.p += 2;
      return { t: T_CTRL, v, s: CTRL_IF };
    }
    
    if (this.at('#elseif')) {
      this.p += 7;
      this.ws();
      const v = this.until('}}');
      this.p += 2;
      return { t: T_CTRL, v, s: CTRL_ELIF };
    }
    
    if (this.at('#else')) {
      this.p += 5;
      this.ws();
      this.expect('}}');
      this.p += 2;
      return { t: T_CTRL, v: '', s: CTRL_ELSE };
    }
    
    if (this.at('/if')) {
      this.p += 3;
      this.ws();
      this.expect('}}');
      this.p += 2;
      return { t: T_CTRL, v: '', s: CTRL_ENDIF };
    }
    
    if (this.at('#for')) {
      this.p += 4;
      this.ws();
      const v = this.until('}}');
      this.p += 2;
      return { t: T_CTRL, v, s: CTRL_FOR };
    }
    
    if (this.at('/for')) {
      this.p += 4;
      this.ws();
      this.expect('}}');
      this.p += 2;
      return { t: T_CTRL, v: '', s: CTRL_ENDFOR };
    }
    
    if (this.at('#each')) {
      this.p += 5;
      this.ws();
      const v = this.until('}}');
      this.p += 2;
      return { t: T_CTRL, v, s: CTRL_EACH };
    }
    
    if (this.at('/each')) {
      this.p += 5;
      this.ws();
      this.expect('}}');
      this.p += 2;
      return { t: T_CTRL, v: '', s: CTRL_ENDEACH };
    }
    
    // Regular expression
    const v = this.until('}}');
    this.p += 2;
    return { t: T_CTRL, v, s: CTRL_EXPR };
  }
  
  private ws(): void {
    while (this.p < this.i.length && /\s/.test(this.i[this.p])) {
      this.p++;
    }
  }
  
  private at(s: string): boolean {
    return this.i.slice(this.p, this.p + s.length) === s;
  }
  
  private until(d: string): string {
    let v = '';
    while (this.p < this.i.length && !this.at(d)) {
      v += this.i[this.p++];
    }
    return v.trim();
  }
  
  private expect(s: string): void {
    if (!this.at(s)) throw new TemplateError(`Expected "${s}"`);
  }
}