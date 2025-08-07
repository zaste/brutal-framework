/**
 * Real Template Caching Test
 * Validates actual DocumentFragment caching works correctly
 */

const { JSDOM } = require('jsdom');

// Set up JSDOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.performance = { now: () => Date.now() };

// Import the CommonJS version for testing
const { ShadowDOMOptimizer } = require('../src/shadow-dom-optimizer.cjs');

describe('Real Template Caching', () => {
  beforeEach(() => {
    ShadowDOMOptimizer.reset();
  });

  test('should cache DocumentFragment for repeated templates', () => {
    const template = `
      <div class="container">
        <h2>Test Component</h2>
        <button>Click me</button>
      </div>
    `;
    
    const config = { mode: 'open', delegatesFocus: true };
    
    // First creation should miss cache
    const host1 = document.createElement('div');
    const shadowRoot1 = ShadowDOMOptimizer._instantiateFromTemplate(host1, template, config);
    
    expect(ShadowDOMOptimizer.cacheMisses).toBe(1);
    expect(ShadowDOMOptimizer.cacheHits).toBe(0);
    expect(ShadowDOMOptimizer.templateCache.size).toBe(1);
    
    // Second creation should hit cache
    const host2 = document.createElement('div');
    const shadowRoot2 = ShadowDOMOptimizer._instantiateFromTemplate(host2, template, config);
    
    expect(ShadowDOMOptimizer.cacheMisses).toBe(1);
    expect(ShadowDOMOptimizer.cacheHits).toBe(1);
    expect(ShadowDOMOptimizer.templateCache.size).toBe(1);
    
    // Verify both shadow roots have the content but are independent
    expect(shadowRoot1.querySelector('h2').textContent).toBe('Test Component');
    expect(shadowRoot2.querySelector('h2').textContent).toBe('Test Component');
    
    // Modify one shouldn't affect the other
    shadowRoot1.querySelector('h2').textContent = 'Modified';
    expect(shadowRoot2.querySelector('h2').textContent).toBe('Test Component');
  });

  test('should create different cache entries for different configs', () => {
    const template = '<div>Same template</div>';
    
    const config1 = { mode: 'open', delegatesFocus: true };
    const config2 = { mode: 'open', delegatesFocus: false };
    
    const host1 = document.createElement('div');
    ShadowDOMOptimizer._instantiateFromTemplate(host1, template, config1);
    
    const host2 = document.createElement('div');
    ShadowDOMOptimizer._instantiateFromTemplate(host2, template, config2);
    
    // Should have 2 cache entries for different configs
    expect(ShadowDOMOptimizer.templateCache.size).toBe(2);
    expect(ShadowDOMOptimizer.cacheMisses).toBe(2);
    expect(ShadowDOMOptimizer.cacheHits).toBe(0);
  });

  test('should report correct cache efficiency metrics', () => {
    const template = '<div>Cached template</div>';
    const config = { mode: 'open' };
    
    // Create 5 identical elements
    for (let i = 0; i < 5; i++) {
      const host = document.createElement('div');
      ShadowDOMOptimizer._instantiateFromTemplate(host, template, config);
    }
    
    const metrics = ShadowDOMOptimizer.getPerformanceMetrics();
    
    expect(metrics.cacheEfficiency.templates).toBe(1);
    expect(metrics.cacheEfficiency.hits).toBe(4);
    expect(metrics.cacheEfficiency.misses).toBe(1);
    expect(metrics.cacheEfficiency.hitRate).toBe('80.00%');
  });

  test('should handle empty templates gracefully', () => {
    const template = '';
    const config = { mode: 'open' };
    
    const host = document.createElement('div');
    const shadowRoot = ShadowDOMOptimizer._instantiateFromTemplate(host, template, config);
    
    expect(shadowRoot).toBeTruthy();
    expect(shadowRoot.children.length).toBe(0);
    expect(ShadowDOMOptimizer.templateCache.size).toBe(1);
  });

  test('should handle complex nested templates', () => {
    const template = `
      <div class="outer">
        <div class="inner">
          <span>Text</span>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </div>
    `;
    
    const config = { mode: 'open' };
    
    const host1 = document.createElement('div');
    const shadowRoot1 = ShadowDOMOptimizer._instantiateFromTemplate(host1, template, config);
    
    const host2 = document.createElement('div');
    const shadowRoot2 = ShadowDOMOptimizer._instantiateFromTemplate(host2, template, config);
    
    // Verify structure is preserved
    expect(shadowRoot1.querySelector('.outer .inner span').textContent).toBe('Text');
    expect(shadowRoot2.querySelector('.outer .inner ul li').textContent).toBe('Item 1');
    
    // Verify caching worked
    expect(ShadowDOMOptimizer.cacheHits).toBe(1);
    expect(ShadowDOMOptimizer.cacheMisses).toBe(1);
  });

  test('should measure template instantiation performance', () => {
    const template = '<div>Performance test</div>';
    const config = { mode: 'open' };
    
    const host = document.createElement('div');
    ShadowDOMOptimizer._instantiateFromTemplate(host, template, config);
    
    const metrics = ShadowDOMOptimizer.getPerformanceMetrics();
    
    expect(metrics.templateInstantiation.count).toBeGreaterThan(0);
    expect(typeof metrics.templateInstantiation.avg).toBe('number');
    expect(metrics.templateInstantiation.avg).toBeGreaterThan(0);
  });
});

module.exports = {
  testRealTemplateCaching: () => {
    console.log('Real template caching tests available');
    return ShadowDOMOptimizer.getPerformanceMetrics();
  }
};