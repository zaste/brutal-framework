/**
 * Safe expression evaluator for templates
 * 
 * Evaluates JavaScript-like expressions without using eval()
 * Supports property access, operators, function calls, and filters
 */

import type { ExpressionNode, TemplateContext, FilterFunction } from '../types.js';
import { TemplateError } from '../types.js';

/**
 * Token types for expression lexer
 */
type TokenType = 
  | 'IDENTIFIER' | 'NUMBER' | 'STRING' | 'BOOLEAN' | 'NULL' | 'UNDEFINED'
  | 'DOT' | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET' | 'COMMA'
  | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'MODULO'
  | 'LT' | 'GT' | 'LTE' | 'GTE' | 'EQ' | 'NEQ' | 'STRICT_EQ' | 'STRICT_NEQ'
  | 'AND' | 'OR' | 'NOT'
  | 'QUESTION' | 'COLON'
  | 'PIPE'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

/**
 * Tokenizes an expression string
 */
export class Lexer {
  private pos = 0;
  private current = '';
  
  constructor(private input: string) {
    this.current = input[0] || '';
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      
      if (this.pos >= this.input.length) break;
      
      const token = this.nextToken();
      if (token) tokens.push(token);
    }
    
    tokens.push({ type: 'EOF', value: '', start: this.pos, end: this.pos });
    return tokens;
  }
  
  private nextToken(): Token | null {
    const start = this.pos;
    
    // Numbers
    if (this.isDigit(this.current)) {
      return this.readNumber(start);
    }
    
    // Strings
    if (this.current === '"' || this.current === "'") {
      return this.readString(start);
    }
    
    // Identifiers and keywords
    if (this.isIdentifierStart(this.current)) {
      return this.readIdentifier(start);
    }
    
    // Operators and punctuation
    switch (this.current) {
      case '.': this.advance(); return { type: 'DOT', value: '.', start, end: this.pos };
      case '(': this.advance(); return { type: 'LPAREN', value: '(', start, end: this.pos };
      case ')': this.advance(); return { type: 'RPAREN', value: ')', start, end: this.pos };
      case '[': this.advance(); return { type: 'LBRACKET', value: '[', start, end: this.pos };
      case ']': this.advance(); return { type: 'RBRACKET', value: ']', start, end: this.pos };
      case ',': this.advance(); return { type: 'COMMA', value: ',', start, end: this.pos };
      case '+': this.advance(); return { type: 'PLUS', value: '+', start, end: this.pos };
      case '-': this.advance(); return { type: 'MINUS', value: '-', start, end: this.pos };
      case '*': this.advance(); return { type: 'MULTIPLY', value: '*', start, end: this.pos };
      case '/': this.advance(); return { type: 'DIVIDE', value: '/', start, end: this.pos };
      case '%': this.advance(); return { type: 'MODULO', value: '%', start, end: this.pos };
      case '?': this.advance(); return { type: 'QUESTION', value: '?', start, end: this.pos };
      case ':': this.advance(); return { type: 'COLON', value: ':', start, end: this.pos };
      case '!':
        this.advance();
        if (this.current === '=') {
          this.advance();
          if (this.current === '=') {
            this.advance();
            return { type: 'STRICT_NEQ', value: '!==', start, end: this.pos };
          }
          return { type: 'NEQ', value: '!=', start, end: this.pos };
        }
        return { type: 'NOT', value: '!', start, end: this.pos };
      case '<':
        this.advance();
        if (this.current === '=') {
          this.advance();
          return { type: 'LTE', value: '<=', start, end: this.pos };
        }
        return { type: 'LT', value: '<', start, end: this.pos };
      case '>':
        this.advance();
        if (this.current === '=') {
          this.advance();
          return { type: 'GTE', value: '>=', start, end: this.pos };
        }
        return { type: 'GT', value: '>', start, end: this.pos };
      case '=':
        this.advance();
        if (this.current === '=') {
          this.advance();
          if (this.current === '=') {
            this.advance();
            return { type: 'STRICT_EQ', value: '===', start, end: this.pos };
          }
          return { type: 'EQ', value: '==', start, end: this.pos };
        }
        throw new TemplateError(`Unexpected character '=' at position ${start}`);
      case '&':
        this.advance();
        if (this.current === '&') {
          this.advance();
          return { type: 'AND', value: '&&', start, end: this.pos };
        }
        throw new TemplateError(`Unexpected character '&' at position ${start}`);
      case '|':
        this.advance();
        if (this.current === '|') {
          this.advance();
          return { type: 'OR', value: '||', start, end: this.pos };
        }
        // Put back the position for PIPE
        this.pos--;
        this.current = '|';
        this.advance();
        return { type: 'PIPE', value: '|', start, end: this.pos };
    }
    
    throw new TemplateError(`Unexpected character '${this.current}' at position ${this.pos}`);
  }
  
  private advance(): void {
    this.pos++;
    this.current = this.input[this.pos] || '';
  }
  
  private peek(): string {
    return this.input[this.pos + 1] || '';
  }
  
  private skipWhitespace(): void {
    while (/\s/.test(this.current)) {
      this.advance();
    }
  }
  
  private isDigit(ch: string): boolean {
    return /\d/.test(ch);
  }
  
  private isIdentifierStart(ch: string): boolean {
    return /[a-zA-Z_$]/.test(ch);
  }
  
  private isIdentifierPart(ch: string): boolean {
    return /[a-zA-Z0-9_$]/.test(ch);
  }
  
  private readNumber(start: number): Token {
    let value = '';
    
    while (this.isDigit(this.current) || this.current === '.') {
      value += this.current;
      this.advance();
    }
    
    return { type: 'NUMBER', value, start, end: this.pos };
  }
  
  private readString(start: number): Token {
    const quote = this.current;
    this.advance(); // Skip opening quote
    
    let value = '';
    while (this.current && this.current !== quote) {
      if (this.current === '\\') {
        this.advance();
        if (this.current) {
          value += this.current;
          this.advance();
        }
      } else {
        value += this.current;
        this.advance();
      }
    }
    
    if (this.current !== quote) {
      throw new TemplateError(`Unterminated string at position ${start}`);
    }
    
    this.advance(); // Skip closing quote
    return { type: 'STRING', value, start, end: this.pos };
  }
  
  private readIdentifier(start: number): Token {
    let value = '';
    
    while (this.isIdentifierPart(this.current)) {
      value += this.current;
      this.advance();
    }
    
    // Check for keywords
    const type = this.getKeywordType(value);
    return { type, value, start, end: this.pos };
  }
  
  private getKeywordType(value: string): TokenType {
    switch (value) {
      case 'true':
      case 'false':
        return 'BOOLEAN';
      case 'null':
        return 'NULL';
      case 'undefined':
        return 'UNDEFINED';
      default:
        return 'IDENTIFIER';
    }
  }
}

/**
 * Parses tokens into an expression tree
 */
export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  
  parse(expression: string): ExpressionNode {
    const lexer = new Lexer(expression);
    this.tokens = lexer.tokenize();
    this.current = 0;
    
    return this.parseExpression();
  }
  
  private parseExpression(): ExpressionNode {
    return this.parseTernary();
  }
  
  private parseTernary(): ExpressionNode {
    let expr = this.parseLogicalOr();
    
    if (this.match('QUESTION')) {
      const consequent = this.parseExpression();
      this.consume('COLON', "Expected ':' in ternary expression");
      const alternate = this.parseExpression();
      
      return {
        type: 'conditional',
        test: expr,
        consequent,
        alternate
      };
    }
    
    return expr;
  }
  
  private parseLogicalOr(): ExpressionNode {
    let expr = this.parseLogicalAnd();
    
    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseLogicalAnd(): ExpressionNode {
    let expr = this.parseEquality();
    
    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseEquality(): ExpressionNode {
    let expr = this.parseRelational();
    
    while (this.match('EQ', 'NEQ', 'STRICT_EQ', 'STRICT_NEQ')) {
      const operator = this.previous().value;
      const right = this.parseRelational();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseRelational(): ExpressionNode {
    let expr = this.parseAdditive();
    
    while (this.match('LT', 'GT', 'LTE', 'GTE')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseAdditive(): ExpressionNode {
    let expr = this.parseMultiplicative();
    
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseMultiplicative(): ExpressionNode {
    let expr = this.parseUnary();
    
    while (this.match('MULTIPLY', 'DIVIDE', 'MODULO')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private parseUnary(): ExpressionNode {
    if (this.match('NOT', 'MINUS')) {
      const operator = this.previous().value;
      const argument = this.parseUnary();
      return {
        type: 'unary',
        operator,
        argument
      };
    }
    
    return this.parsePostfix();
  }
  
  private parsePostfix(): ExpressionNode {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match('DOT')) {
        const property = this.consume('IDENTIFIER', 'Expected property name after "."');
        expr = {
          type: 'member',
          object: expr,
          property: { type: 'literal', value: property.value },
          computed: false
        };
      } else if (this.match('LBRACKET')) {
        const property = this.parseExpression();
        this.consume('RBRACKET', 'Expected "]"');
        expr = {
          type: 'member',
          object: expr,
          property,
          computed: true
        };
      } else if (this.match('LPAREN')) {
        const args: ExpressionNode[] = [];
        
        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
        }
        
        this.consume('RPAREN', 'Expected ")" after arguments');
        expr = {
          type: 'call',
          callee: expr,
          arguments: args
        };
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  private parsePrimary(): ExpressionNode {
    if (this.match('NUMBER')) {
      return {
        type: 'literal',
        value: parseFloat(this.previous().value)
      };
    }
    
    if (this.match('STRING')) {
      return {
        type: 'literal',
        value: this.previous().value
      };
    }
    
    if (this.match('BOOLEAN')) {
      return {
        type: 'literal',
        value: this.previous().value === 'true'
      };
    }
    
    if (this.match('NULL')) {
      return {
        type: 'literal',
        value: null
      };
    }
    
    if (this.match('UNDEFINED')) {
      return {
        type: 'literal',
        value: undefined
      };
    }
    
    if (this.match('IDENTIFIER')) {
      return {
        type: 'identifier',
        name: this.previous().value
      };
    }
    
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', 'Expected ")" after expression');
      return expr;
    }
    
    throw new TemplateError(`Unexpected token: ${this.peek().value}`);
  }
  
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }
  
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new TemplateError(message);
  }
}

/**
 * Evaluates an expression tree with a given context
 */
export class ExpressionEvaluator {
  private filters: Record<string, FilterFunction> = {};
  
  constructor(filters?: Record<string, FilterFunction>) {
    if (filters) this.filters = filters;
  }
  
  evaluate(expression: string, context: TemplateContext): any {
    // First check if expression contains filters (single | not part of ||)
    // A filter pipe must have whitespace or be at start/end, and the part after | must look like a filter name
    const filterMatch = expression.match(/\s\|\s+([a-zA-Z_]\w*)/);
    const hasFilters = filterMatch !== null;
    
    if (hasFilters) {
      // Handle filter syntax: value | filter | filter2
      // Split by | but not || (negative lookbehind and lookahead)
      const parts = expression.split(/\s*(?<!\|)\|(?!\|)\s*/);
      
      if (parts.length > 1) {
        // Parse the base expression
        const parser = new Parser();
        let value = this.evaluateNode(parser.parse(parts[0]), context);
        
        // Apply filters
        for (let i = 1; i < parts.length; i++) {
          const filterCall = parts[i];
          const match = filterCall.match(/^(\w+)(?:\((.*)\))?$/);
          
          if (!match) {
            throw new TemplateError(`Invalid filter syntax: ${filterCall}`);
          }
          
          const [, filterName, argsStr] = match;
          const filter = this.filters[filterName];
          
          if (!filter) {
            throw new TemplateError(`Unknown filter: ${filterName}`);
          }
          
          // Parse filter arguments
          const args = argsStr ? this.parseFilterArgs(argsStr, context) : [];
          value = filter(value, ...args);
        }
        
        return value;
      }
    }
    
    // No filters, just evaluate the expression
    const parser = new Parser();
    const ast = parser.parse(expression);
    return this.evaluateNode(ast, context);
  }
  
  private evaluateNode(node: ExpressionNode, context: TemplateContext): any {
    switch (node.type) {
      case 'literal':
        return node.value;
        
      case 'identifier':
        return context[node.name];
        
      case 'member':
        const object = this.evaluateNode(node.object, context);
        if (object == null) return undefined;
        
        const property = node.computed
          ? this.evaluateNode(node.property, context)
          : (node.property as any).value;
          
        return object[property];
        
      case 'call':
        const callee = this.evaluateNode(node.callee, context);
        if (typeof callee !== 'function') {
          throw new TemplateError('Attempted to call a non-function');
        }
        
        const args = node.arguments.map(arg => this.evaluateNode(arg, context));
        return callee(...args);
        
      case 'binary':
        // For logical operators, we need to handle short-circuit evaluation
        if (node.operator === '&&' || node.operator === '||') {
          const left = this.evaluateNode(node.left, context);
          
          // Short-circuit evaluation
          if (node.operator === '&&' && !left) return false;
          if (node.operator === '||' && left) return true;
          
          const right = this.evaluateNode(node.right, context);
          return node.operator === '&&' ? left && right : left || right;
        }
        
        // For other operators, evaluate both sides first
        const left = this.evaluateNode(node.left, context);
        const right = this.evaluateNode(node.right, context);
        
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '%': return left % right;
          case '<': return left < right;
          case '>': return left > right;
          case '<=': return left <= right;
          case '>=': return left >= right;
          case '==': return left == right;
          case '!=': return left != right;
          case '===': return left === right;
          case '!==': return left !== right;
          default:
            throw new TemplateError(`Unknown operator: ${node.operator}`);
        }
        
      case 'unary':
        const argument = this.evaluateNode(node.argument, context);
        
        switch (node.operator) {
          case '!': return !argument;
          case '-': return -argument;
          default:
            throw new TemplateError(`Unknown unary operator: ${node.operator}`);
        }
        
      case 'conditional':
        const test = this.evaluateNode(node.test, context);
        return test
          ? this.evaluateNode(node.consequent, context)
          : this.evaluateNode(node.alternate, context);
        
      default:
        throw new TemplateError(`Unknown node type: ${(node as any).type}`);
    }
  }
  
  private parseFilterArgs(argsStr: string, context: TemplateContext): any[] {
    // Simple argument parsing - just split by comma and evaluate each
    return argsStr.split(',').map(arg => {
      const trimmed = arg.trim();
      
      // Try to parse as literal
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        return trimmed.slice(1, -1);
      }
      
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (trimmed === 'null') return null;
      if (trimmed === 'undefined') return undefined;
      
      const num = parseFloat(trimmed);
      if (!isNaN(num)) return num;
      
      // Otherwise evaluate as expression
      const parser = new Parser();
      return this.evaluateNode(parser.parse(trimmed), context);
    });
  }
}