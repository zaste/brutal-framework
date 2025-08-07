/**
 * Tests for template compiler with control flow
 */

import { describe, it, expect } from '@jest/globals';
import { compile } from './compiler.js';
import { TemplateError } from '../types.js';

describe('Compiler', () => {
  describe('basic templates', () => {
    it('should compile static text', () => {
      const template = compile('Hello, World!');
      expect(template.render({})).toBe('Hello, World!');
    });
    
    it('should compile expressions', () => {
      const template = compile('Hello, {{name}}!');
      expect(template.render({ name: 'John' })).toBe('Hello, John!');
    });
    
    it('should handle multiple expressions', () => {
      const template = compile('{{greeting}}, {{name}}!');
      expect(template.render({ greeting: 'Hi', name: 'Jane' })).toBe('Hi, Jane!');
    });
    
    it('should handle complex expressions', () => {
      const template = compile('Price: ${{price * quantity}}');
      expect(template.render({ price: 10, quantity: 3 })).toBe('Price: $30');
    });
    
    it('should escape HTML by default', () => {
      const template = compile('{{html}}');
      expect(template.render({ html: '<script>alert("xss")</script>' }))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
    
    it('should respect escape option', () => {
      const template = compile('{{html}}', { escape: false });
      expect(template.render({ html: '<b>bold</b>' })).toBe('<b>bold</b>');
    });
  });
  
  describe('conditional rendering', () => {
    it('should handle simple if', () => {
      const template = compile('{{#if show}}Visible{{/if}}');
      
      expect(template.render({ show: true })).toBe('Visible');
      expect(template.render({ show: false })).toBe('');
    });
    
    it('should handle if-else', () => {
      const template = compile('{{#if logged}}Welcome{{#else}}Please login{{/if}}');
      
      expect(template.render({ logged: true })).toBe('Welcome');
      expect(template.render({ logged: false })).toBe('Please login');
    });
    
    it('should handle if-elseif-else', () => {
      const template = compile(`{{#if score >= 90}}A{{#elseif score >= 80}}B{{#elseif score >= 70}}C{{#else}}F{{/if}}`);
      
      expect(template.render({ score: 95 })).toBe('A');
      expect(template.render({ score: 85 })).toBe('B');
      expect(template.render({ score: 75 })).toBe('C');
      expect(template.render({ score: 65 })).toBe('F');
    });
    
    it('should handle nested if', () => {
      const template = compile(`
        {{#if user}}
          {{#if user.admin}}
            Admin: {{user.name}}
          {{#else}}
            User: {{user.name}}
          {{/if}}
        {{#else}}
          Guest
        {{/if}}
      `.trim());
      
      expect(template.render({ user: { name: 'John', admin: true } }))
        .toContain('Admin: John');
      expect(template.render({ user: { name: 'Jane', admin: false } }))
        .toContain('User: Jane');
      expect(template.render({ user: null }))
        .toContain('Guest');
    });
    
    it('should evaluate complex conditions', () => {
      const template = compile('{{#if age >= 18 && hasLicense}}Can drive{{/if}}');
      
      expect(template.render({ age: 20, hasLicense: true })).toBe('Can drive');
      expect(template.render({ age: 20, hasLicense: false })).toBe('');
      expect(template.render({ age: 16, hasLicense: true })).toBe('');
    });
  });
  
  describe('loops', () => {
    it('should handle for loop', () => {
      const template = compile(`
        {{#for item in items}}
          - {{item}}
        {{/for}}
      `.trim());
      
      expect(template.render({ items: ['a', 'b', 'c'] }))
        .toBe('\n          - a\n        \n          - b\n        \n          - c\n        ');
    });
    
    it('should handle for loop with arrays', () => {
      const template = compile('{{#for num in numbers}}{{num}} {{/for}}');
      
      expect(template.render({ numbers: [1, 2, 3] })).toBe('1 2 3 ');
    });
    
    it('should handle empty arrays', () => {
      const template = compile('{{#for item in items}}{{item}}{{/for}}Empty');
      
      expect(template.render({ items: [] })).toBe('Empty');
    });
    
    it('should handle nested for loops', () => {
      const template = compile(`
        {{#for row in matrix}}
          {{#for col in row}}{{col}} {{/for}}|
        {{/for}}
      `.trim());
      
      expect(template.render({ 
        matrix: [
          [1, 2],
          [3, 4]
        ]
      })).toBe('\n          1 2 |\n        \n          3 4 |\n        ');
    });
    
    it('should create new scope in loops', () => {
      const template = compile(`
        {{#for item in items}}
          {{item}}: {{name}}
        {{/for}}
        Outside: {{item}}
      `.trim());
      
      expect(template.render({ 
        items: ['A', 'B'],
        name: 'Test',
        item: 'Original'
      })).toContain('Outside: Original');
    });
  });
  
  describe('each loops', () => {
    it('should handle each with arrays', () => {
      const template = compile('{{#each val in arr}}{{val}} {{/each}}');
      
      expect(template.render({ arr: ['a', 'b', 'c'] })).toBe('a b c ');
    });
    
    it('should handle each with array indices', () => {
      const template = compile('{{#each val, idx in arr}}{{idx}}:{{val}} {{/each}}');
      
      expect(template.render({ arr: ['a', 'b', 'c'] })).toBe('0:a 1:b 2:c ');
    });
    
    it('should handle each with objects', () => {
      const template = compile('{{#each val, key in obj}}{{key}}={{val}} {{/each}}');
      
      expect(template.render({ 
        obj: { name: 'John', age: 30 } 
      })).toBe('name=John age=30 ');
    });
    
    it('should handle nested each', () => {
      const template = compile(`
        {{#each user, id in users}}
          User {{id}}:
          {{#each val, prop in user}}
            {{prop}}: {{val}}
          {{/each}}
        {{/each}}
      `.trim());
      
      const result = template.render({
        users: {
          u1: { name: 'John', age: 30 },
          u2: { name: 'Jane', age: 25 }
        }
      });
      
      expect(result).toContain('User u1:');
      expect(result).toContain('name: John');
      expect(result).toContain('age: 30');
    });
  });
  
  describe('filters', () => {
    it('should apply filters in templates', () => {
      const template = compile('{{name | uppercase}}', {
        filters: {
          uppercase: (s: string) => s.toUpperCase()
        }
      });
      
      expect(template.render({ name: 'john' })).toBe('JOHN');
    });
    
    it('should chain filters', () => {
      const template = compile('{{text | trim | uppercase}}', {
        filters: {
          trim: (s: string) => s.trim(),
          uppercase: (s: string) => s.toUpperCase()
        }
      });
      
      expect(template.render({ text: '  hello  ' })).toBe('HELLO');
    });
    
    it('should pass filter arguments', () => {
      const template = compile('{{text | truncate(10)}}', {
        filters: {
          truncate: (s: string, len: number) => s.slice(0, len)
        }
      });
      
      expect(template.render({ text: 'This is a long text' })).toBe('This is a ');
    });
  });
  
  describe('complex templates', () => {
    it('should handle mixed control flow', () => {
      const template = compile(`
        <ul>
        {{#for user in users}}
          {{#if user.active}}
            <li>{{user.name}} ({{user.role | uppercase}})</li>
          {{/if}}
        {{/for}}
        </ul>
      `.trim(), {
        filters: {
          uppercase: (s: string) => s.toUpperCase()
        }
      });
      
      const result = template.render({
        users: [
          { name: 'John', role: 'admin', active: true },
          { name: 'Jane', role: 'user', active: false },
          { name: 'Bob', role: 'user', active: true }
        ]
      });
      
      expect(result).toContain('<li>John (ADMIN)</li>');
      expect(result).not.toContain('Jane');
      expect(result).toContain('<li>Bob (USER)</li>');
    });
    
    it('should handle shopping cart example', () => {
      const template = compile(`
        {{#if cart.items.length > 0}}
          <h2>Shopping Cart</h2>
          {{#each item, idx in cart.items}}
            <div>
              {{idx + 1}}. {{item.name}} - \${{item.price}}
              {{#if item.quantity > 1}}(x{{item.quantity}}){{/if}}
            </div>
          {{/each}}
          <hr>
          Total: \${{cart.total}}
        {{#else}}
          <p>Your cart is empty</p>
        {{/if}}
      `.trim());
      
      const result = template.render({
        cart: {
          items: [
            { name: 'Book', price: 15, quantity: 2 },
            { name: 'Pen', price: 5, quantity: 1 }
          ],
          total: 35
        }
      });
      
      expect(result).toContain('Shopping Cart');
      expect(result).toContain('1. Book - $15');
      expect(result).toContain('2. Pen - $5');
      expect(result).toContain('Total: $35');
    });
  });
  
  describe('error handling', () => {
    it('should throw on unclosed if', () => {
      expect(() => compile('{{#if true}}Unclosed'))
        .toThrow(TemplateError);
    });
    
    it('should throw on invalid for syntax', () => {
      expect(() => compile('{{#for items}}Invalid{{/for}}'))
        .toThrow('Invalid for loop syntax');
    });
    
    it('should throw on invalid each syntax', () => {
      expect(() => compile('{{#each}}Invalid{{/each}}'))
        .toThrow('Invalid each loop syntax');
    });
    
    it('should provide line numbers in errors', () => {
      try {
        compile('Line 1\n{{#if condition}}\nLine 3');
      } catch (err: any) {
        expect(err).toBeInstanceOf(TemplateError);
        expect(err.line).toBeDefined();
      }
    });
  });
});