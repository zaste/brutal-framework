/**
 * Shadow DOM Performance Test Suite
 * Based on Chromium shadow_root.cc patterns and WPT focus delegation tests
 * Tests optimization patterns against performance targets
 */

const { JSDOM } = require('jsdom');

// Set up JSDOM environment with Shadow DOM support
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  pretendToBeVisual: true,
  resources: 'usable'
});

global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.performance = {
  now: () => Date.now()
};
global.CSSStyleSheet = class CSSStyleSheet {
  constructor() {
    this.cssRules = [];
  }
  replaceSync(css) {
    this.cssText = css;
  }
};

// Import our optimized Shadow DOM implementation
const { ShadowDOMOptimizer } = require('../src/shadow-dom-optimizer.cjs');

describe('Shadow DOM Performance Optimization', () => {
  let testHost;

  beforeEach(() => {
    testHost = document.createElement('div');
    document.body.appendChild(testHost);
    ShadowDOMOptimizer.reset();
  });

  afterEach(() => {
    if (testHost.parentNode) {
      testHost.parentNode.removeChild(testHost);
    }
  });

  // Performance Target: Shadow DOM creation should be <5ms
  describe('Shadow Root Creation Performance', () => {
    test('should create shadow root within performance target', () => {
      const startTime = performance.now();
      
      const shadowRoot = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost, {
        mode: 'open',
        delegatesFocus: true
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(shadowRoot).toBeTruthy();
      expect(shadowRoot.mode).toBe('open');
      expect(duration).toBeLessThan(5); // Target: <5ms
    });

    test('should benefit from caching on repeated configurations', () => {
      const config = { mode: 'open', delegatesFocus: true };
      
      // First creation
      const start1 = performance.now();
      const shadowRoot1 = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost, config);
      const end1 = performance.now();
      const duration1 = end1 - start1;
      
      // Second creation with same config (should be faster due to caching)
      const testHost2 = document.createElement('div');
      const start2 = performance.now();
      const shadowRoot2 = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost2, config);
      const end2 = performance.now();
      const duration2 = end2 - start2;
      
      expect(shadowRoot1).toBeTruthy();
      expect(shadowRoot2).toBeTruthy();
      expect(duration2).toBeLessThanOrEqual(duration1); // Second should be faster or equal
    });
  });

  // Performance Target: Style injection should be <2ms
  describe('Style Injection Performance', () => {
    test('should inject styles within performance target', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      const styles = `
        :host { display: block; }
        .container { padding: 10px; }
        .button { background: blue; color: white; }
      `;
      
      const startTime = performance.now();
      ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot, styles);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2); // Target: <2ms
      
      // Verify styles were injected
      const styleElements = shadowRoot.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);
    });

    test('should use constructable stylesheets when available', () => {
      // Mock adoptedStyleSheets support
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      shadowRoot.adoptedStyleSheets = [];
      
      const styles = ':host { color: red; }';
      
      ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot, styles, {
        constructableStyleSheets: true
      });
      
      expect(shadowRoot.adoptedStyleSheets.length).toBe(1);
    });

    test('should cache stylesheets for reuse', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      const styles = '.test { color: blue; }';
      
      // First injection
      ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot, styles, { cache: true });
      
      // Second injection of same styles (should use cache)
      const testHost2 = document.createElement('div');
      const shadowRoot2 = testHost2.attachShadow({ mode: 'open' });
      
      ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot2, styles, { cache: true });
      
      const metrics = ShadowDOMOptimizer.getPerformanceMetrics();
      expect(metrics.styleResolution.count).toBe(2);
    });
  });

  // Performance Target: Slot assignment should be <1ms
  describe('Slot Assignment Performance', () => {
    test('should optimize slot assignment within performance target', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = `
        <slot name="header"></slot>
        <slot name="content"></slot>
        <slot></slot>
      `;
      
      const slottedElements = [
        (() => { const el = document.createElement('div'); el.slot = 'header'; return el; })(),
        (() => { const el = document.createElement('div'); el.slot = 'content'; return el; })(),
        document.createElement('span') // default slot
      ];
      
      const startTime = performance.now();
      const slotMap = ShadowDOMOptimizer.optimizeSlotAssignment(shadowRoot, slottedElements);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1); // Target: <1ms
      expect(slotMap).toBeTruthy();
      expect(slotMap.size).toBeGreaterThan(0);
    });

    test('should handle complex slot hierarchies efficiently', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = `
        <div class="container">
          <slot name="slot1"></slot>
          <div class="nested">
            <slot name="slot2"></slot>
            <slot name="slot3"></slot>
          </div>
          <slot></slot>
        </div>
      `;
      
      const manyElements = Array.from({ length: 50 }, (_, i) => {
        const el = document.createElement('div');
        el.slot = `slot${(i % 3) + 1}`;
        return el;
      });
      
      const startTime = performance.now();
      ShadowDOMOptimizer.optimizeSlotAssignment(shadowRoot, manyElements);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // Even with 50 elements, should be <5ms
    });
  });

  // Performance Target: Focus delegation should be <0.5ms
  describe('Focus Delegation Performance', () => {
    test('should setup focus delegation within performance target', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open', delegatesFocus: true });
      shadowRoot.innerHTML = `
        <input type="text" id="first">
        <button id="second">Button</button>
        <input type="text" id="third" tabindex="-1">
      `;
      
      const startTime = performance.now();
      ShadowDOMOptimizer.setupOptimizedFocusDelegation(shadowRoot, {
        delegatesFocus: true
      });
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(0.5); // Target: <0.5ms
      
      // Verify focus handler was attached
      expect(testHost._optimizedFocusHandler).toBeTruthy();
    });

    test('should correctly identify first focusable element', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = `
        <div>Not focusable</div>
        <input type="text" style="display: none" id="hidden">
        <input type="text" id="first-visible">
        <button id="second">Button</button>
      `;
      
      ShadowDOMOptimizer.setupOptimizedFocusDelegation(shadowRoot, {
        delegatesFocus: true,
        skipHiddenElements: true
      });
      
      // Test focus delegation
      const focusEvent = new Event('focus');
      testHost.dispatchEvent(focusEvent);
      
      // Should focus the first visible focusable element
      expect(shadowRoot.activeElement?.id).toBe('first-visible');
    });
  });

  // Test comprehensive optimization patterns
  describe('OptimizedShadowElement Integration', () => {
    test('should integrate all optimizations seamlessly', () => {
      class TestOptimizedElement extends OptimizedShadowElement {
        constructor() {
          super();
          
          const shadowRoot = this.createOptimizedShadow({
            delegatesFocus: true
          });
          
          shadowRoot.innerHTML = `
            <slot name="header"></slot>
            <div class="content">
              <input type="text" placeholder="Focus me">
              <button>Click me</button>
            </div>
            <slot></slot>
          `;
          
          this.addOptimizedStyles(`
            :host {
              display: block;
              padding: 16px;
              border: 1px solid #ccc;
            }
            .content {
              margin: 8px 0;
            }
            input, button {
              margin: 4px;
              padding: 8px;
            }
          `);
        }
      }
      
      customElements.define('test-optimized-element', TestOptimizedElement);
      
      const startTime = performance.now();
      const element = document.createElement('test-optimized-element');
      document.body.appendChild(element);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // Complete element creation <10ms
      
      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot.querySelector('input')).toBeTruthy();
      expect(element._isOptimized).toBe(true);
      
      // Test metrics collection
      const metrics = element.getOptimizationMetrics();
      expect(metrics.shadowRootCreation.count).toBeGreaterThan(0);
      expect(metrics.styleResolution.count).toBeGreaterThan(0);
    });
  });

  // Memory optimization tests
  describe('Memory Optimization', () => {
    test('should cleanup resources on disconnect', () => {
      const shadowRoot = testHost.attachShadow({ mode: 'open' });
      
      ShadowDOMOptimizer.setupOptimizedFocusDelegation(shadowRoot, {
        delegatesFocus: true
      });
      
      expect(testHost._optimizedFocusHandler).toBeTruthy();
      
      // Simulate disconnection
      document.body.removeChild(testHost);
      ShadowDOMOptimizer.optimizeMemoryUsage(shadowRoot);
      
      // Handler should be cleaned up
      expect(testHost._optimizedFocusHandler).toBeFalsy();
    });

    test('should manage cache sizes efficiently', () => {
      // Create many different style configurations to test cache management
      for (let i = 0; i < 150; i++) {
        const styles = `.test-${i} { color: color-${i}; }`;
        const shadowRoot = testHost.attachShadow({ mode: 'open' });
        ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot, styles, { cache: true });
      }
      
      const metrics = ShadowDOMOptimizer.getPerformanceMetrics();
      
      // Cache should be managed (not exceed reasonable limits)
      expect(metrics.cacheEfficiency.styleSheets).toBeLessThan(200);
    });
  });

  // Regression tests to ensure optimizations don't break functionality
  describe('Functionality Regression Tests', () => {
    test('should maintain standard Shadow DOM behavior', () => {
      const shadowRoot = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost, {
        mode: 'open'
      });
      
      shadowRoot.innerHTML = '<p>Shadow content</p>';
      
      expect(shadowRoot.querySelector('p')).toBeTruthy();
      expect(shadowRoot.querySelector('p').textContent).toBe('Shadow content');
      expect(shadowRoot.host).toBe(testHost);
    });

    test('should maintain slot functionality', () => {
      const shadowRoot = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost, {
        mode: 'open'
      });
      
      shadowRoot.innerHTML = '<slot name="test"></slot>';
      
      const slottedElement = document.createElement('span');
      slottedElement.slot = 'test';
      slottedElement.textContent = 'Slotted content';
      testHost.appendChild(slottedElement);
      
      ShadowDOMOptimizer.optimizeSlotAssignment(shadowRoot, [slottedElement]);
      
      // Slot should still work
      const slot = shadowRoot.querySelector('slot[name="test"]');
      expect(slot).toBeTruthy();
    });

    test('should maintain focus delegation behavior', () => {
      const shadowRoot = ShadowDOMOptimizer.createOptimizedShadowRoot(testHost, {
        mode: 'open',
        delegatesFocus: true
      });
      
      shadowRoot.innerHTML = `
        <input type="text" id="first">
        <input type="text" id="second">
      `;
      
      ShadowDOMOptimizer.setupOptimizedFocusDelegation(shadowRoot);
      
      // Focus the host
      testHost.focus();
      
      // First input should receive focus
      expect(shadowRoot.activeElement?.id).toBe('first');
    });
  });

  // Performance benchmarking
  describe('Performance Benchmarks', () => {
    test('should benchmark against Day 4 performance targets', () => {
      const iterations = 100;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const host = document.createElement('div');
        const startTime = performance.now();
        
        const shadowRoot = ShadowDOMOptimizer.createOptimizedShadowRoot(host, {
          mode: 'open',
          delegatesFocus: true
        });
        
        ShadowDOMOptimizer.injectOptimizedStyles(shadowRoot, `
          :host { display: block; }
          .content { padding: 10px; }
        `);
        
        shadowRoot.innerHTML = '<div class="content"><slot></slot></div>';
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`Shadow DOM Creation Benchmark (${iterations} iterations):`);
      console.log(`  Average: ${avgTime.toFixed(3)}ms`);
      console.log(`  Min: ${minTime.toFixed(3)}ms`);
      console.log(`  Max: ${maxTime.toFixed(3)}ms`);
      
      // Target: Average creation time should be under 5ms
      expect(avgTime).toBeLessThan(5);
      
      // Target: 95% of creations should be under 10ms
      const under10ms = times.filter(time => time < 10).length;
      const percentUnder10ms = (under10ms / times.length) * 100;
      expect(percentUnder10ms).toBeGreaterThanOrEqual(95);
    });
  });
});

// Export for external benchmarking
module.exports = {
  runShadowDOMBenchmarks: () => {
    console.log('Shadow DOM optimization benchmarks available');
    return ShadowDOMOptimizer.getPerformanceMetrics();
  }
};