/**
 * Tests for template engine
 */

import { describe, it, expect } from '@jest/globals';
import { compile, render } from './engine.js';

describe('Template Engine', () => {
  describe('compile', () => {
    it('should compile a template', () => {
      const template = compile('Hello, {{name}}!');
      expect(template.render).toBeInstanceOf(Function);
      expect(template.source).toBe('Hello, {{name}}!');
      expect(template.timestamp).toBeGreaterThan(0);
    });
    
    it('should compile with options', () => {
      const template = compile('{{html}}', { escape: false });
      expect(template.render({ html: '<b>bold</b>' })).toBe('<b>bold</b>');
    });
    
    it('should handle nested properties', () => {
      const template = compile('Hello {{user.name}}!');
      expect(template.render({ user: { name: 'Alice' } })).toBe('Hello Alice!');
    });
    
    it('should handle missing values', () => {
      const template = compile('Hello {{name}}!');
      expect(template.render({})).toBe('Hello !');
    });
  });
  
  describe('render', () => {
    it('should render a simple template', () => {
      const result = render('Hello, {{name}}!', { name: 'World' });
      expect(result).toBe('Hello, World!');
    });
    
    it('should render with control flow', () => {
      const template = `
        {{#if items.length > 0}}
          {{#for item in items}}
            - {{item}}
          {{/for}}
        {{#else}}
          No items
        {{/if}}
      `;
      
      expect(render(template, { items: ['A', 'B'] })).toContain('- A');
      expect(render(template, { items: [] })).toContain('No items');
    });
    
    it('should render with filters', () => {
      const result = render('{{name | uppercase}}', { name: 'john' }, {
        filters: {
          uppercase: (s: string) => s.toUpperCase()
        }
      });
      
      expect(result).toBe('JOHN');
    });
    
    it('should escape HTML by default', () => {
      expect(render('{{content}}', { content: '<script>alert("xss")</script>' }))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
    
    it('should use empty object when data parameter is omitted', () => {
      expect(render('Hello!')).toBe('Hello!');
      expect(render('{{name}}')).toBe('');
    });
  });
});