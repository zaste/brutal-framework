/**
 * Tagged template literal for HTML
 */

import { compileCompact as compile } from '../core/optimizer.js';

/**
 * HTML tagged template literal
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    
    if (i < values.length) {
      const value = values[i];
      
      // Handle arrays
      if (Array.isArray(value)) {
        result += value.join('');
      }
      // Handle null/undefined
      else if (value == null) {
        result += '';
      }
      // Handle objects (for style/class objects)
      else if (typeof value === 'object') {
        result += JSON.stringify(value);
      }
      // Everything else
      else {
        result += escapeHtml(String(value));
      }
    }
  }
  
  return result;
}

/**
 * Create a reusable template function
 */
html.template = function(strings: TemplateStringsArray, ...keys: string[]) {
  return function(data: Record<string, any>): string {
    let template = '';
    
    for (let i = 0; i < strings.length; i++) {
      template += strings[i];
      if (i < keys.length) {
        template += '{{' + keys[i] + '}}';
      }
    }
    
    return compile(template).render(data);
  };
};

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, (match) => htmlEntities[match as keyof typeof htmlEntities] || match);
}