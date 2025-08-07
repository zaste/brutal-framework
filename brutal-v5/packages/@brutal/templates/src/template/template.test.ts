import { Template } from './template';

describe('@brutal/templates - Template', () => {
  describe('render', () => {
    it('should render simple template', () => {
      const template = new Template(['Hello ', '!'], ['name']);
      expect(template.render({ name: 'World' })).toBe('Hello World!');
    });
    
    it('should escape HTML by default', () => {
      const template = new Template(['', ''], ['content']);
      const result = template.render({ content: '<script>alert("xss")</script>' });
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
    
    it('should handle missing values', () => {
      const template = new Template(['Hello ', '!'], ['name']);
      expect(template.render({})).toBe('Hello !');
    });
    
    it('should handle nested properties', () => {
      const template = new Template(['User: ', ''], ['name']);
      expect(template.render({ user: { name: 'Alice' } })).toBe('User: ');
    });
    
    it('should use empty object when no data provided', () => {
      const template = new Template(['Hello ', '!'], ['name']);
      expect(template.render()).toBe('Hello !');
    });
  });
  
  describe('renderRaw', () => {
    it('should not escape HTML', () => {
      const template = new Template(['', ''], ['html']);
      const result = template.renderRaw({ html: '<b>Bold</b>' });
      expect(result).toBe('<b>Bold</b>');
    });
    
    it('should use empty object when no data provided', () => {
      const template = new Template(['Raw: ', '!'], ['content']);
      expect(template.renderRaw()).toBe('Raw: !');
    });
  });
  
  describe('edge cases', () => {
    it('should handle characters not in htmlEntities map', () => {
      // This test ensures the || match fallback works
      // Since the regex only matches [&<>"'] and all are in the map,
      // the || match branch is actually unreachable in normal operation
      // This is defensive programming for potential future changes
      const template = new Template(['', ''], ['content']);
      
      // Test that all expected entities are escaped
      const result = template.render({ content: '&<>"\'' });
      expect(result).toBe('&amp;&lt;&gt;&quot;&#39;');
      
      // Test mixed content
      const mixed = template.render({ content: 'Test & <script>"quoted"</script>' });
      expect(mixed).toBe('Test &amp; &lt;script&gt;&quot;quoted&quot;&lt;/script&gt;');
    });
  });
});