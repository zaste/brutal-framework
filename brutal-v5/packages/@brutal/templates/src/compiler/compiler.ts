/**
 * Template compiler with control flow support
 * 
 * Compiles template strings with expressions and control flow into
 * executable functions
 */

import type { 
  TemplateFunction, 
  TemplateContext, 
  TemplateOptions,
  CompiledTemplate 
} from '../types.js';
import { ExpressionEvaluator } from '../expression/evaluator.js';
import { TemplateError } from '../types.js';

/**
 * Token types for template parser
 */
type TokenType = 
  | 'TEXT'
  | 'EXPRESSION'
  | 'IF'
  | 'ELSE_IF'
  | 'ELSE'
  | 'END_IF'
  | 'FOR'
  | 'END_FOR'
  | 'EACH'
  | 'END_EACH';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

/**
 * AST node types for template compiler
 */
type ASTNode =
  | { type: 'text'; value: string }
  | { type: 'expression'; value: string }
  | { type: 'if'; condition: string; consequent: ASTNode[]; alternate: ASTNode[] | null }
  | { type: 'for'; variable: string; iterable: string; body: ASTNode[] }
  | { type: 'each'; value: string; key: string; iterable: string; body: ASTNode[] };

/**
 * Template tokenizer
 */
class Tokenizer {
  private pos = 0;
  private line = 1;
  private column = 1;
  
  constructor(private template: string) {}
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.template.length) {
      // Look for template expressions
      if (this.match('{{')) {
        const token = this.readTemplateToken();
        if (token) tokens.push(token);
      } else {
        // Read text until next {{ or end
        const token = this.readText();
        if (token.value) tokens.push(token);
      }
    }
    
    return tokens;
  }
  
  private match(str: string): boolean {
    if (this.template.slice(this.pos, this.pos + str.length) === str) {
      return true;
    }
    return false;
  }
  
  private advance(count = 1): void {
    for (let i = 0; i < count; i++) {
      if (this.template[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.pos++;
    }
  }
  
  private readText(): Token {
    const start = this.pos;
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    
    while (this.pos < this.template.length && !this.match('{{')) {
      value += this.template[this.pos];
      this.advance();
    }
    
    return {
      type: 'TEXT',
      value,
      start,
      end: this.pos,
      line: startLine,
      column: startColumn
    };
  }
  
  private readTemplateToken(): Token | null {
    const start = this.pos;
    const startLine = this.line;
    const startColumn = this.column;
    
    // Skip {{
    this.advance(2);
    this.skipWhitespace();
    
    // Check for control flow keywords
    if (this.match('#if')) {
      this.advance(3);
      this.skipWhitespace();
      const condition = this.readUntil('}}');
      this.advance(2); // Skip }}
      
      return {
        type: 'IF',
        value: condition,
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('#elseif')) {
      this.advance(7);
      this.skipWhitespace();
      const condition = this.readUntil('}}');
      this.advance(2);
      
      return {
        type: 'ELSE_IF',
        value: condition,
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('#else')) {
      this.advance(5);
      this.skipWhitespace();
      this.expectString('}}');
      this.advance(2);
      
      return {
        type: 'ELSE',
        value: '',
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('/if')) {
      this.advance(3);
      this.skipWhitespace();
      this.expectString('}}');
      this.advance(2);
      
      return {
        type: 'END_IF',
        value: '',
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('#for')) {
      this.advance(4);
      this.skipWhitespace();
      const loop = this.readUntil('}}');
      this.advance(2);
      
      return {
        type: 'FOR',
        value: loop,
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('/for')) {
      this.advance(4);
      this.skipWhitespace();
      this.expectString('}}');
      this.advance(2);
      
      return {
        type: 'END_FOR',
        value: '',
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('#each')) {
      this.advance(5);
      this.skipWhitespace();
      const loop = this.readUntil('}}');
      this.advance(2);
      
      return {
        type: 'EACH',
        value: loop,
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.match('/each')) {
      this.advance(5);
      this.skipWhitespace();
      this.expectString('}}');
      this.advance(2);
      
      return {
        type: 'END_EACH',
        value: '',
        start,
        end: this.pos,
        line: startLine,
        column: startColumn
      };
    }
    
    // Regular expression
    const expression = this.readUntil('}}');
    this.advance(2);
    
    return {
      type: 'EXPRESSION',
      value: expression,
      start,
      end: this.pos,
      line: startLine,
      column: startColumn
    };
  }
  
  private skipWhitespace(): void {
    while (this.pos < this.template.length && /\s/.test(this.template[this.pos])) {
      this.advance();
    }
  }
  
  private readUntil(delimiter: string): string {
    let value = '';
    
    while (this.pos < this.template.length && !this.match(delimiter)) {
      value += this.template[this.pos];
      this.advance();
    }
    
    return value.trim();
  }
  
  private expectString(expected: string): void {
    if (!this.match(expected)) {
      throw new TemplateError(
        `Expected "${expected}" at line ${this.line}, column ${this.column}`,
        this.line,
        this.column
      );
    }
  }
}

/**
 * Template parser - converts tokens to AST
 */
class Parser {
  private current = 0;
  private tokens: Token[] = [];
  
  parse(tokens: Token[]): ASTNode[] {
    this.tokens = tokens;
    this.current = 0;
    
    return this.parseNodes();
  }
  
  private parseNodes(): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      const node = this.parseNode();
      if (node) nodes.push(node);
    }
    
    return nodes;
  }
  
  private parseNode(): ASTNode | null {
    const token = this.peek();
    
    switch (token.type) {
      case 'TEXT':
        this.advance();
        return { type: 'text', value: token.value };
        
      case 'EXPRESSION':
        this.advance();
        return { type: 'expression', value: token.value };
        
      case 'IF':
        return this.parseIf();
        
      case 'FOR':
        return this.parseFor();
        
      case 'EACH':
        return this.parseEach();
        
      default:
        // End tokens are handled by their respective parsers
        return null;
    }
  }
  
  private parseIf(): ASTNode {
    const ifToken = this.consume('IF', 'Expected IF token');
    const condition = ifToken.value;
    const consequent: ASTNode[] = [];
    let alternate: ASTNode[] | null = null;
    
    // Parse consequent
    while (!this.isAtEnd() && !this.check('ELSE_IF', 'ELSE', 'END_IF')) {
      const node = this.parseNode();
      if (node) consequent.push(node);
    }
    
    // Handle else-if and else
    if (this.check('ELSE_IF')) {
      // Build a chain of else-if blocks
      const elseIfNodes: ASTNode[] = [];
      
      while (this.match('ELSE_IF')) {
        const elseIfToken = this.previous();
        const elseIfCondition = elseIfToken.value;
        const elseIfBody: ASTNode[] = [];
        
        while (!this.isAtEnd() && !this.check('ELSE_IF', 'ELSE', 'END_IF')) {
          const node = this.parseNode();
          if (node) elseIfBody.push(node);
        }
        
        elseIfNodes.push({
          type: 'if',
          condition: elseIfCondition,
          consequent: elseIfBody,
          alternate: null
        });
      }
      
      // Chain the else-if nodes from last to first
      let currentAlternate: ASTNode[] | null = null;
      for (let i = elseIfNodes.length - 1; i >= 0; i--) {
        const node = elseIfNodes[i] as any;
        node.alternate = currentAlternate;
        currentAlternate = [node];
      }
      alternate = currentAlternate;
    }
    
    if (this.match('ELSE')) {
      const elseBody: ASTNode[] = [];
      
      while (!this.isAtEnd() && !this.check('END_IF')) {
        const node = this.parseNode();
        if (node) elseBody.push(node);
      }
      
      if (alternate) {
        // Find the deepest else-if node to attach the else to
        let current = alternate[0] as any;
        while (current.alternate && current.alternate.length === 1 && current.alternate[0].type === 'if') {
          current = current.alternate[0];
        }
        current.alternate = elseBody;
      } else {
        alternate = elseBody;
      }
    }
    
    this.consume('END_IF', 'Expected {{/if}}');
    
    return {
      type: 'if',
      condition,
      consequent,
      alternate
    };
  }
  
  private parseFor(): ASTNode {
    const forToken = this.consume('FOR', 'Expected FOR token');
    const loop = forToken.value;
    
    // Parse "variable in iterable" syntax
    const match = loop.match(/^\s*(\w+)\s+in\s+(.+)$/);
    if (!match) {
      throw new TemplateError(
        `Invalid for loop syntax: "${loop}". Expected "variable in iterable"`,
        forToken.line,
        forToken.column
      );
    }
    
    const [, variable, iterable] = match;
    const body: ASTNode[] = [];
    
    while (!this.isAtEnd() && !this.check('END_FOR')) {
      const node = this.parseNode();
      if (node) body.push(node);
    }
    
    this.consume('END_FOR', 'Expected {{/for}}');
    
    return {
      type: 'for',
      variable,
      iterable,
      body
    };
  }
  
  private parseEach(): ASTNode {
    const eachToken = this.consume('EACH', 'Expected EACH token');
    const loop = eachToken.value;
    
    // Parse "value, key in iterable" or "value in iterable" syntax
    const match = loop.match(/^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
    if (!match) {
      throw new TemplateError(
        `Invalid each loop syntax: "${loop}". Expected "value in iterable" or "value, key in iterable"`,
        eachToken.line,
        eachToken.column
      );
    }
    
    const [, value, key = 'index', iterable] = match;
    const body: ASTNode[] = [];
    
    while (!this.isAtEnd() && !this.check('END_EACH')) {
      const node = this.parseNode();
      if (node) body.push(node);
    }
    
    this.consume('END_EACH', 'Expected {{/each}}');
    
    return {
      type: 'each',
      value,
      key,
      iterable,
      body
    };
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
  
  private check(...types: TokenType[]): boolean {
    if (this.isAtEnd()) return false;
    return types.includes(this.peek().type);
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }
  
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const token = this.isAtEnd() ? this.previous() : this.peek();
    throw new TemplateError(message, token.line, token.column);
  }
}

/**
 * Code generator - converts AST to JavaScript function
 */
class CodeGenerator {
  private evaluator: ExpressionEvaluator;
  
  constructor(private options: TemplateOptions = {}) {
    this.evaluator = new ExpressionEvaluator(options.filters);
  }
  
  generate(ast: ASTNode[]): TemplateFunction {
    const code = this.generateCode(ast);
    
    // Create function that captures evaluator in closure
    const evaluator = this.evaluator;
    const escape = this.options.escape !== false ? this.escapeHtml : (s: any) => String(s);
    
    // Create the template function
    const fn = new Function('evaluator', 'escape', `
      return function(context) {
        ${code}
      };
    `)(evaluator, escape);
    
    return fn as TemplateFunction;
  }
  
  private generateCode(nodes: ASTNode[]): string {
    const parts: string[] = ['let __output = "";'];
    
    for (const node of nodes) {
      parts.push(this.generateNode(node));
    }
    
    parts.push('return __output;');
    return parts.join('\n');
  }
  
  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'text':
        return `__output += ${JSON.stringify(node.value)};`;
        
      case 'expression':
        return `__output += escape(evaluator.evaluate(${JSON.stringify(node.value)}, context));`;
        
      case 'if':
        let code = `if (evaluator.evaluate(${JSON.stringify(node.condition)}, context)) {\n`;
        code += node.consequent.map(n => this.generateNode(n)).join('\n');
        code += '\n}';
        
        if (node.alternate) {
          code += ' else {\n';
          code += node.alternate.map(n => this.generateNode(n)).join('\n');
          code += '\n}';
        }
        
        return code;
        
      case 'for': {
        const iterableCode = `evaluator.evaluate(${JSON.stringify(node.iterable)}, context)`;
        let code = `const __iterable = ${iterableCode};\n`;
        code += `if (__iterable && typeof __iterable[Symbol.iterator] === 'function') {\n`;
        code += `  for (const ${node.variable} of __iterable) {\n`;
        code += `    const __ctx = Object.create(context);\n`;
        code += `    __ctx.${node.variable} = ${node.variable};\n`;
        code += `    context = __ctx;\n`;
        code += node.body.map(n => this.generateNode(n)).join('\n');
        code += `\n    context = Object.getPrototypeOf(context);\n`;
        code += `  }\n`;
        code += `}`;
        
        return code;
      }
        
      case 'each': {
        const iterableCode = `evaluator.evaluate(${JSON.stringify(node.iterable)}, context)`;
        let code = `const __obj = ${iterableCode};\n`;
        code += `if (__obj) {\n`;
        code += `  const __entries = Array.isArray(__obj) ? __obj.map((v, i) => [i, v]) : Object.entries(__obj);\n`;
        code += `  for (const [${node.key}, ${node.value}] of __entries) {\n`;
        code += `    const __ctx = Object.create(context);\n`;
        code += `    __ctx.${node.key} = ${node.key};\n`;
        code += `    __ctx.${node.value} = ${node.value};\n`;
        code += `    context = __ctx;\n`;
        code += node.body.map(n => this.generateNode(n)).join('\n');
        code += `\n    context = Object.getPrototypeOf(context);\n`;
        code += `  }\n`;
        code += `}`;
        
        return code;
      }
        
      default:
        throw new TemplateError(`Unknown node type: ${(node as any).type}`);
    }
  }
  
  private escapeHtml(str: any): string {
    if (str == null) return '';
    
    const s = String(str);
    const escaped = s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    return escaped;
  }
}

/**
 * Template compiler
 */
export class Compiler {
  private tokenizer = new Tokenizer('');
  private parser = new Parser();
  private generator: CodeGenerator;
  
  constructor(private options: TemplateOptions = {}) {
    this.generator = new CodeGenerator(options);
  }
  
  compile(template: string): CompiledTemplate {
    // Tokenize
    this.tokenizer = new Tokenizer(template);
    const tokens = this.tokenizer.tokenize();
    
    // Parse
    const ast = this.parser.parse(tokens);
    
    // Generate
    const render = this.generator.generate(ast);
    
    return {
      render,
      source: template,
      timestamp: Date.now()
    };
  }
}

/**
 * Compile a template string
 */
export function compile(template: string, options?: TemplateOptions): CompiledTemplate {
  const compiler = new Compiler(options);
  return compiler.compile(template);
}