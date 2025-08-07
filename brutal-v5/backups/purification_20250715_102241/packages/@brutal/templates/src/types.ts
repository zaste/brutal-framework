/**
 * Type definitions for @brutal/templates
 */

/**
 * Template context data
 */
export interface TemplateContext {
  [key: string]: any;
}

/**
 * Compiled template function
 */
export interface TemplateFunction {
  (context: TemplateContext): string;
}

/**
 * Template compilation options
 */
export interface TemplateOptions {
  /** Enable HTML escaping (default: true) */
  escape?: boolean;
  /** Enable template caching */
  cache?: boolean;
  /** Custom delimiters */
  delimiters?: {
    open: string;
    close: string;
  };
  /** Available filters */
  filters?: Record<string, FilterFunction>;
  /** Strict mode - throw on undefined variables */
  strict?: boolean;
}

/**
 * Compiled template with metadata
 */
export interface CompiledTemplate {
  /** The compiled render function */
  render: TemplateFunction;
  /** Template source */
  source: string;
  /** Compilation timestamp */
  timestamp: number;
  /** Dependencies (variables used) */
  dependencies?: string[];
}

/**
 * Filter function for value transformation
 */
export type FilterFunction = (value: any, ...args: any[]) => any;

/**
 * Template directive definition
 */
export interface Directive {
  /** Directive name */
  name: string;
  /** Bind function called when directive is applied */
  bind?: (element: Element, value: any, context: TemplateContext) => void;
  /** Update function called when value changes */
  update?: (element: Element, value: any, context: TemplateContext) => void;
  /** Unbind function called when directive is removed */
  unbind?: (element: Element) => void;
}

/**
 * Template expression AST node types
 */
export type ExpressionNode = 
  | { type: 'literal'; value: any }
  | { type: 'identifier'; name: string }
  | { type: 'member'; object: ExpressionNode; property: ExpressionNode; computed: boolean }
  | { type: 'call'; callee: ExpressionNode; arguments: ExpressionNode[] }
  | { type: 'binary'; operator: string; left: ExpressionNode; right: ExpressionNode }
  | { type: 'unary'; operator: string; argument: ExpressionNode }
  | { type: 'conditional'; test: ExpressionNode; consequent: ExpressionNode; alternate: ExpressionNode };

/**
 * Template error with location info
 */
export class TemplateError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number,
    public source?: string
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}