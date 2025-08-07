/**
 * Tests for expression evaluator
 */

import { describe, it, expect } from '@jest/globals';
import { ExpressionEvaluator, Parser, Lexer } from './evaluator.js';
import { TemplateError } from '../types.js';

describe('Lexer', () => {
  it('should tokenize simple identifiers', () => {
    const lexer = new Lexer('foo bar baz');
    const tokens = lexer.tokenize();
    
    expect(tokens).toHaveLength(4); // 3 identifiers + EOF
    expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'foo' });
    expect(tokens[1]).toMatchObject({ type: 'IDENTIFIER', value: 'bar' });
    expect(tokens[2]).toMatchObject({ type: 'IDENTIFIER', value: 'baz' });
  });
  
  it('should tokenize numbers', () => {
    const lexer = new Lexer('42 3.14 0.5');
    const tokens = lexer.tokenize();
    
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '42' });
    expect(tokens[1]).toMatchObject({ type: 'NUMBER', value: '3.14' });
    expect(tokens[2]).toMatchObject({ type: 'NUMBER', value: '0.5' });
  });
  
  it('should tokenize strings', () => {
    const lexer = new Lexer('"hello" \'world\'');
    const tokens = lexer.tokenize();
    
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello' });
    expect(tokens[1]).toMatchObject({ type: 'STRING', value: 'world' });
  });
  
  it('should tokenize operators', () => {
    const lexer = new Lexer('+ - * / % < > <= >= == != === !== && || !');
    const tokens = lexer.tokenize();
    
    expect(tokens[0]).toMatchObject({ type: 'PLUS' });
    expect(tokens[1]).toMatchObject({ type: 'MINUS' });
    expect(tokens[2]).toMatchObject({ type: 'MULTIPLY' });
    expect(tokens[3]).toMatchObject({ type: 'DIVIDE' });
    expect(tokens[4]).toMatchObject({ type: 'MODULO' });
  });
  
  it('should tokenize keywords', () => {
    const lexer = new Lexer('true false null undefined');
    const tokens = lexer.tokenize();
    
    expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'true' });
    expect(tokens[1]).toMatchObject({ type: 'BOOLEAN', value: 'false' });
    expect(tokens[2]).toMatchObject({ type: 'NULL', value: 'null' });
    expect(tokens[3]).toMatchObject({ type: 'UNDEFINED', value: 'undefined' });
  });
});

describe('Parser', () => {
  it('should parse literals', () => {
    const parser = new Parser();
    
    expect(parser.parse('42')).toEqual({ type: 'literal', value: 42 });
    expect(parser.parse('"hello"')).toEqual({ type: 'literal', value: 'hello' });
    expect(parser.parse('true')).toEqual({ type: 'literal', value: true });
    expect(parser.parse('null')).toEqual({ type: 'literal', value: null });
  });
  
  it('should parse identifiers', () => {
    const parser = new Parser();
    
    expect(parser.parse('foo')).toEqual({ type: 'identifier', name: 'foo' });
  });
  
  it('should parse member expressions', () => {
    const parser = new Parser();
    
    expect(parser.parse('user.name')).toEqual({
      type: 'member',
      object: { type: 'identifier', name: 'user' },
      property: { type: 'literal', value: 'name' },
      computed: false
    });
    
    expect(parser.parse('items[0]')).toEqual({
      type: 'member',
      object: { type: 'identifier', name: 'items' },
      property: { type: 'literal', value: 0 },
      computed: true
    });
  });
  
  it('should parse binary expressions', () => {
    const parser = new Parser();
    
    expect(parser.parse('2 + 3')).toEqual({
      type: 'binary',
      operator: '+',
      left: { type: 'literal', value: 2 },
      right: { type: 'literal', value: 3 }
    });
    
    expect(parser.parse('age >= 18')).toEqual({
      type: 'binary',
      operator: '>=',
      left: { type: 'identifier', name: 'age' },
      right: { type: 'literal', value: 18 }
    });
  });
  
  it('should parse logical expressions', () => {
    const parser = new Parser();
    
    expect(parser.parse('a && b')).toEqual({
      type: 'binary',
      operator: '&&',
      left: { type: 'identifier', name: 'a' },
      right: { type: 'identifier', name: 'b' }
    });
  });
  
  it('should parse ternary expressions', () => {
    const parser = new Parser();
    
    expect(parser.parse('a ? b : c')).toEqual({
      type: 'conditional',
      test: { type: 'identifier', name: 'a' },
      consequent: { type: 'identifier', name: 'b' },
      alternate: { type: 'identifier', name: 'c' }
    });
  });
  
  it('should parse function calls', () => {
    const parser = new Parser();
    
    expect(parser.parse('fn()')).toEqual({
      type: 'call',
      callee: { type: 'identifier', name: 'fn' },
      arguments: []
    });
    
    expect(parser.parse('fn(1, "hello")')).toEqual({
      type: 'call',
      callee: { type: 'identifier', name: 'fn' },
      arguments: [
        { type: 'literal', value: 1 },
        { type: 'literal', value: 'hello' }
      ]
    });
  });
  
  it('should respect operator precedence', () => {
    const parser = new Parser();
    
    // Multiplication before addition
    const ast1 = parser.parse('2 + 3 * 4');
    expect(ast1).toMatchObject({
      type: 'binary',
      operator: '+',
      left: { type: 'literal', value: 2 },
      right: {
        type: 'binary',
        operator: '*',
        left: { type: 'literal', value: 3 },
        right: { type: 'literal', value: 4 }
      }
    });
    
    // Comparison after arithmetic
    const ast2 = parser.parse('a + b > c * d');
    expect(ast2).toMatchObject({
      type: 'binary',
      operator: '>'
    });
  });
});

describe('ExpressionEvaluator', () => {
  const evaluator = new ExpressionEvaluator();
  
  describe('literals', () => {
    it('should evaluate number literals', () => {
      expect(evaluator.evaluate('42', {})).toBe(42);
      expect(evaluator.evaluate('3.14', {})).toBe(3.14);
    });
    
    it('should evaluate string literals', () => {
      expect(evaluator.evaluate('"hello"', {})).toBe('hello');
      expect(evaluator.evaluate("'world'", {})).toBe('world');
    });
    
    it('should evaluate boolean literals', () => {
      expect(evaluator.evaluate('true', {})).toBe(true);
      expect(evaluator.evaluate('false', {})).toBe(false);
    });
    
    it('should evaluate null and undefined', () => {
      expect(evaluator.evaluate('null', {})).toBe(null);
      expect(evaluator.evaluate('undefined', {})).toBe(undefined);
    });
  });
  
  describe('identifiers', () => {
    it('should evaluate identifiers from context', () => {
      const context = { name: 'John', age: 30 };
      
      expect(evaluator.evaluate('name', context)).toBe('John');
      expect(evaluator.evaluate('age', context)).toBe(30);
    });
    
    it('should return undefined for missing identifiers', () => {
      expect(evaluator.evaluate('missing', {})).toBe(undefined);
    });
  });
  
  describe('member expressions', () => {
    it('should evaluate dot notation', () => {
      const context = {
        user: { name: 'John', age: 30 }
      };
      
      expect(evaluator.evaluate('user.name', context)).toBe('John');
      expect(evaluator.evaluate('user.age', context)).toBe(30);
    });
    
    it('should evaluate bracket notation', () => {
      const context = {
        items: ['a', 'b', 'c'],
        obj: { key: 'value' }
      };
      
      expect(evaluator.evaluate('items[0]', context)).toBe('a');
      expect(evaluator.evaluate('items[1]', context)).toBe('b');
      expect(evaluator.evaluate('obj["key"]', context)).toBe('value');
    });
    
    it('should handle nested access', () => {
      const context = {
        data: {
          users: [
            { name: 'John' },
            { name: 'Jane' }
          ]
        }
      };
      
      expect(evaluator.evaluate('data.users[0].name', context)).toBe('John');
      expect(evaluator.evaluate('data.users[1].name', context)).toBe('Jane');
    });
    
    it('should return undefined for null/undefined objects', () => {
      const context = { obj: null };
      
      expect(evaluator.evaluate('obj.prop', context)).toBe(undefined);
      expect(evaluator.evaluate('missing.prop', context)).toBe(undefined);
    });
  });
  
  describe('arithmetic operations', () => {
    it('should evaluate addition', () => {
      expect(evaluator.evaluate('2 + 3', {})).toBe(5);
      expect(evaluator.evaluate('"hello" + " " + "world"', {})).toBe('hello world');
    });
    
    it('should evaluate subtraction', () => {
      expect(evaluator.evaluate('10 - 3', {})).toBe(7);
    });
    
    it('should evaluate multiplication', () => {
      expect(evaluator.evaluate('4 * 5', {})).toBe(20);
    });
    
    it('should evaluate division', () => {
      expect(evaluator.evaluate('10 / 2', {})).toBe(5);
    });
    
    it('should evaluate modulo', () => {
      expect(evaluator.evaluate('10 % 3', {})).toBe(1);
    });
    
    it('should evaluate with context values', () => {
      const context = { price: 10, quantity: 3 };
      expect(evaluator.evaluate('price * quantity', context)).toBe(30);
    });
  });
  
  describe('comparison operations', () => {
    it('should evaluate less than', () => {
      expect(evaluator.evaluate('2 < 3', {})).toBe(true);
      expect(evaluator.evaluate('3 < 2', {})).toBe(false);
    });
    
    it('should evaluate greater than', () => {
      expect(evaluator.evaluate('3 > 2', {})).toBe(true);
      expect(evaluator.evaluate('2 > 3', {})).toBe(false);
    });
    
    it('should evaluate less than or equal', () => {
      expect(evaluator.evaluate('2 <= 2', {})).toBe(true);
      expect(evaluator.evaluate('2 <= 3', {})).toBe(true);
      expect(evaluator.evaluate('3 <= 2', {})).toBe(false);
    });
    
    it('should evaluate greater than or equal', () => {
      expect(evaluator.evaluate('3 >= 3', {})).toBe(true);
      expect(evaluator.evaluate('3 >= 2', {})).toBe(true);
      expect(evaluator.evaluate('2 >= 3', {})).toBe(false);
    });
    
    it('should evaluate equality', () => {
      expect(evaluator.evaluate('2 == 2', {})).toBe(true);
      expect(evaluator.evaluate('2 == "2"', {})).toBe(true);
      expect(evaluator.evaluate('2 != 3', {})).toBe(true);
    });
    
    it('should evaluate strict equality', () => {
      expect(evaluator.evaluate('2 === 2', {})).toBe(true);
      expect(evaluator.evaluate('2 === "2"', {})).toBe(false);
      expect(evaluator.evaluate('2 !== "2"', {})).toBe(true);
    });
  });
  
  describe('logical operations', () => {
    it('should evaluate AND', () => {
      expect(evaluator.evaluate('true && true', {})).toBe(true);
      expect(evaluator.evaluate('true && false', {})).toBe(false);
      expect(evaluator.evaluate('false && true', {})).toBe(false);
    });
    
    it('should evaluate OR', () => {
      expect(evaluator.evaluate('true || false', {})).toBe(true);
      expect(evaluator.evaluate('false || false', {})).toBe(false);
    });
    
    it('should evaluate NOT', () => {
      expect(evaluator.evaluate('!true', {})).toBe(false);
      expect(evaluator.evaluate('!false', {})).toBe(true);
      expect(evaluator.evaluate('!0', {})).toBe(true);
      expect(evaluator.evaluate('!1', {})).toBe(false);
    });
    
    it('should short-circuit evaluation', () => {
      const context = { a: false, b: true };
      
      expect(evaluator.evaluate('a && missing.prop', context)).toBe(false);
      expect(evaluator.evaluate('b || missing.prop', context)).toBe(true);
    });
  });
  
  describe('ternary operator', () => {
    it('should evaluate ternary expressions', () => {
      expect(evaluator.evaluate('true ? "yes" : "no"', {})).toBe('yes');
      expect(evaluator.evaluate('false ? "yes" : "no"', {})).toBe('no');
    });
    
    it('should evaluate with context', () => {
      const context = { age: 20 };
      expect(evaluator.evaluate('age >= 18 ? "adult" : "minor"', context)).toBe('adult');
      
      context.age = 15;
      expect(evaluator.evaluate('age >= 18 ? "adult" : "minor"', context)).toBe('minor');
    });
  });
  
  describe('function calls', () => {
    it('should call functions from context', () => {
      const context = {
        greet: (name: string) => `Hello, ${name}!`,
        add: (a: number, b: number) => a + b
      };
      
      expect(evaluator.evaluate('greet("John")', context)).toBe('Hello, John!');
      expect(evaluator.evaluate('add(2, 3)', context)).toBe(5);
    });
    
    it('should throw on non-function calls', () => {
      const context = { notAFunction: 42 };
      
      expect(() => evaluator.evaluate('notAFunction()', context))
        .toThrow('Attempted to call a non-function');
    });
  });
  
  describe('filters', () => {
    it('should apply single filter', () => {
      const evaluator = new ExpressionEvaluator({
        uppercase: (str: string) => str.toUpperCase(),
        double: (n: number) => n * 2
      });
      
      expect(evaluator.evaluate('name | uppercase', { name: 'john' })).toBe('JOHN');
      expect(evaluator.evaluate('value | double', { value: 5 })).toBe(10);
    });
    
    it('should apply multiple filters', () => {
      const evaluator = new ExpressionEvaluator({
        uppercase: (str: string) => str.toUpperCase(),
        reverse: (str: string) => str.split('').reverse().join('')
      });
      
      expect(evaluator.evaluate('name | uppercase | reverse', { name: 'john' }))
        .toBe('NHOJ');
    });
    
    it('should pass arguments to filters', () => {
      const evaluator = new ExpressionEvaluator({
        truncate: (str: string, length: number) => str.slice(0, length),
        multiply: (n: number, factor: number) => n * factor
      });
      
      expect(evaluator.evaluate('text | truncate(5)', { text: 'Hello World' }))
        .toBe('Hello');
      expect(evaluator.evaluate('value | multiply(3)', { value: 4 }))
        .toBe(12);
    });
    
    it('should throw on unknown filter', () => {
      const evaluator = new ExpressionEvaluator({});
      
      expect(() => evaluator.evaluate('value | unknown', { value: 42 }))
        .toThrow('Unknown filter: unknown');
    });
  });
  
  describe('complex expressions', () => {
    it('should evaluate complex nested expressions', () => {
      const context = {
        users: [
          { name: 'John', age: 30, active: true },
          { name: 'Jane', age: 25, active: false }
        ],
        currentIndex: 0
      };
      
      expect(evaluator.evaluate(
        'users[currentIndex].active && users[currentIndex].age > 18',
        context
      )).toBe(true);
      
      context.currentIndex = 1;
      // users[1].active is false, but users[1].name is "Jane"
      // The OR should return true because the second part is true
      expect(evaluator.evaluate(
        'users[currentIndex].active || users[currentIndex].name == "Jane"',
        context
      )).toBe(true);
    });
    
    it('should handle mixed operations', () => {
      const context = {
        price: 100,
        discount: 0.2,
        taxRate: 0.08,
        isMember: true
      };
      
      expect(evaluator.evaluate(
        'price * (1 - (isMember ? discount : 0)) * (1 + taxRate)',
        context
      )).toBe(86.4);
    });
  });
  
  describe('error handling', () => {
    it('should throw on syntax errors', () => {
      expect(() => evaluator.evaluate('2 +', {}))
        .toThrow(TemplateError);
      
      expect(() => evaluator.evaluate('(2 + 3', {}))
        .toThrow('Expected ")" after expression');
    });
    
    it('should throw on invalid tokens', () => {
      expect(() => evaluator.evaluate('2 @ 3', {}))
        .toThrow('Unexpected character');
    });
  });
});