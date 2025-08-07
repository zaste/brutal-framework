/**
 * Template class
 */

export class Template {
  constructor(
    private parts: string[],
    private expressions: string[]
  ) {}
  
  /**
   * Render template with data context
   */
  render(data: Record<string, any> = {}): string {
    let result = '';
    
    // Interleave parts and expressions
    for (let i = 0; i < this.parts.length; i++) {
      result += this.parts[i];
      
      if (i < this.expressions.length) {
        const expr = this.expressions[i];
        const value = this.evaluate(expr!, data);
        result += this.escapeHtml(String(value));
      }
    }
    
    return result;
  }
  
  /**
   * Render without escaping (dangerous!)
   */
  renderRaw(data: Record<string, any> = {}): string {
    let result = '';
    
    // Interleave parts and expressions
    for (let i = 0; i < this.parts.length; i++) {
      result += this.parts[i];
      
      if (i < this.expressions.length) {
        const expr = this.expressions[i];
        const value = this.evaluate(expr!, data);
        result += String(value);
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate expression in data context
   */
  private evaluate(expr: string, data: Record<string, any>): any {
    // Simple property access (e.g., "user.name")
    const keys = expr.trim().split('.');
    let value: any = data;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '';
      }
    }
    
    return value;
  }
  
  /**
   * Escape HTML entities
   */
  private escapeHtml(str: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return str.replace(/[&<>"']/g, (match) => htmlEntities[match] || match);
  }
}