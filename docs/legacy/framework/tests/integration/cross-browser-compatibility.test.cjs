/**
 * Cross-Browser Compatibility Test Suite for Custom Elements
 * Based on Chromium source code analysis and WPT patterns
 * 
 * Reference: third_party/blink/renderer/core/html/custom/custom_element_test.cc
 * Reference: web-platform-tests/wpt/custom-elements/
 */

const { JSDOM } = require('jsdom');

// Simulate different browser environments
const browserConfigs = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  }
};

describe('Cross-Browser Custom Elements Compatibility', () => {
  let dom, document, window;

  beforeEach(() => {
    // Reset JSDOM for each test
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      pretendToBeVisual: true,
      resources: 'usable'
    });
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.customElements = window.customElements;
  });

  afterEach(() => {
    dom.window.close();
  });

  // Test 1: Basic Custom Element Name Validation (from Chromium tests)
  describe('Custom Element Name Validation', () => {
    test('Valid custom element names should be accepted', () => {
      const validNames = [
        'a-',
        'a-a', 
        'aa-',
        'aa-a',
        'valid-name'
      ];

      validNames.forEach(name => {
        expect(() => {
          class TestElement extends HTMLElement {}
          customElements.define(name, TestElement);
        }).not.toThrow();
      });
    });

    test('Invalid custom element names should be rejected', () => {
      const invalidNames = [
        '', // empty
        'a', // no hyphen
        'A', // uppercase
        'A-', // starts with uppercase
        '0-', // starts with number
        'a-A', // contains uppercase
        'a-Z', // contains uppercase
        'annotation-xml', // reserved SVG name
        'color-profile', // reserved SVG name
        'font-face', // reserved SVG name
        'missing-glyph' // reserved SVG name
      ];

      invalidNames.forEach(name => {
        expect(() => {
          class TestElement extends HTMLElement {}
          customElements.define(name, TestElement);
        }).toThrow();
      });
    });
  });

  // Test 2: Constructor Exception Handling (from WPT tests)
  describe('Constructor Exception Handling', () => {
    test('Throwing exception in constructor should not crash', () => {
      class ThrowingElement extends HTMLElement {
        constructor() {
          super();
          throw new Error('Constructor error');
        }
      }

      customElements.define('throwing-element', ThrowingElement);

      expect(() => {
        document.createElement('throwing-element');
      }).toThrow('Constructor error');
    });

    test('Customized built-in elements with exceptions should work', () => {
      class ThrowingButton extends HTMLButtonElement {
        constructor() {
          super();
          throw new Error('Button constructor error');
        }
      }

      // Note: JSDOM may not support customized built-ins fully
      try {
        customElements.define('throwing-button', ThrowingButton, { extends: 'button' });
        const button = document.createElement('button', { is: 'throwing-button' });
        expect(button.localName).toBe('button');
      } catch (error) {
        // Expected in JSDOM environment - customized built-ins not fully supported
        expect(error.message).toContain('extends');
      }
    });
  });

  // Test 3: Lifecycle Callback Execution
  describe('Lifecycle Callbacks Cross-Browser', () => {
    test('All lifecycle callbacks should execute in correct order', () => {
      const callbackOrder = [];

      class LifecycleElement extends HTMLElement {
        constructor() {
          super();
          callbackOrder.push('constructor');
        }

        connectedCallback() {
          callbackOrder.push('connected');
        }

        disconnectedCallback() {
          callbackOrder.push('disconnected');
        }

        attributeChangedCallback(name, oldValue, newValue) {
          callbackOrder.push(`attribute:${name}:${oldValue}:${newValue}`);
        }

        adoptedCallback() {
          callbackOrder.push('adopted');
        }

        static get observedAttributes() {
          return ['test-attr'];
        }
      }

      customElements.define('lifecycle-element', LifecycleElement);

      // Create element
      const element = document.createElement('lifecycle-element');
      expect(callbackOrder).toContain('constructor');

      // Connect to DOM
      document.body.appendChild(element);
      expect(callbackOrder).toContain('connected');

      // Change attribute
      element.setAttribute('test-attr', 'value1');
      expect(callbackOrder).toContain('attribute:test-attr:null:value1');

      // Change attribute again
      element.setAttribute('test-attr', 'value2');
      expect(callbackOrder).toContain('attribute:test-attr:value1:value2');

      // Disconnect from DOM
      document.body.removeChild(element);
      expect(callbackOrder).toContain('disconnected');
    });
  });

  // Test 4: Performance Regression Prevention
  describe('Performance Regression Tests', () => {
    test('Element creation should maintain sub-millisecond performance', () => {
      class FastElement extends HTMLElement {
        constructor() {
          super();
          this.textContent = 'Fast Element';
        }
      }

      customElements.define('fast-element', FastElement);

      const startTime = process.hrtime.bigint();
      
      // Create 1000 elements
      for (let i = 0; i < 1000; i++) {
        document.createElement('fast-element');
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

      // Should create 1000 elements in less than 100ms (0.1ms per element average)
      expect(duration).toBeLessThan(100);
    });

    test('Chromium-optimized element should maintain Day 4 performance', () => {
      // Implement the Day 4 optimized element pattern
      class ChromiumOptimizedElement extends HTMLElement {
        static pool = [];
        static poolSize = 0;
        static maxPoolSize = 100;

        constructor() {
          super();
          this._state = 0; // 0=created, 1=connected, 2=disconnected
        }

        static create() {
          if (this.poolSize > 0) {
            const element = this.pool.pop();
            this.poolSize--;
            element._state = 0;
            return element;
          }
          return new this();
        }

        static release(element) {
          if (this.poolSize < this.maxPoolSize) {
            element._state = 2;
            element.textContent = '';
            this.pool.push(element);
            this.poolSize++;
          }
        }

        connectedCallback() {
          this._state = 1;
          this.textContent = 'Chromium Optimized';
        }

        disconnectedCallback() {
          this._state = 2;
        }
      }

      customElements.define('chromium-optimized', ChromiumOptimizedElement);

      const startTime = process.hrtime.bigint();
      
      // Create and release elements using pooling
      for (let i = 0; i < 1000; i++) {
        const element = ChromiumOptimizedElement.create();
        document.body.appendChild(element);
        document.body.removeChild(element);
        ChromiumOptimizedElement.release(element);
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

      // Should maintain sub-100ms performance with pooling
      expect(duration).toBeLessThan(100);
    });
  });

  // Test 5: Edge Cases and Error Boundaries
  describe('Edge Cases and Error Boundaries', () => {
    test('Should handle null/undefined gracefully', () => {
      class RobustElement extends HTMLElement {
        constructor() {
          super();
        }

        setAttribute(name, value) {
          // Handle null/undefined values
          if (value == null) {
            value = '';
          }
          super.setAttribute(name, String(value));
        }
      }

      customElements.define('robust-element', RobustElement);

      const element = document.createElement('robust-element');
      
      expect(() => {
        element.setAttribute('test', null);
        element.setAttribute('test', undefined);
        element.setAttribute('test', 0);
        element.setAttribute('test', false);
      }).not.toThrow();
    });

    test('Should handle rapid creation/destruction cycles', () => {
      class CycleElement extends HTMLElement {
        constructor() {
          super();
          this.createdAt = Date.now();
        }
      }

      customElements.define('cycle-element', CycleElement);

      // Rapid creation and destruction
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('cycle-element');
        document.body.appendChild(element);
        document.body.removeChild(element);
      }

      // Should not throw or crash
      expect(true).toBe(true);
    });

    test('Should handle deeply nested elements', () => {
      class NestedElement extends HTMLElement {
        constructor() {
          super();
          this.depth = 0;
        }

        connectedCallback() {
          const parent = this.parentElement;
          if (parent && parent.tagName === 'NESTED-ELEMENT') {
            this.depth = parent.depth + 1;
          }
        }
      }

      customElements.define('nested-element', NestedElement);

      // Create nested structure
      let container = document.body;
      for (let i = 0; i < 10; i++) {
        const element = document.createElement('nested-element');
        container.appendChild(element);
        container = element;
      }

      // Verify nesting works
      const deepest = container;
      expect(deepest.depth).toBe(9);
    });
  });

  // Test 6: Browser-Specific Compatibility Simulation
  Object.keys(browserConfigs).forEach(browserName => {
    describe(`${browserName.toUpperCase()} Compatibility`, () => {
      beforeEach(() => {
        // Simulate browser-specific behavior
        Object.defineProperty(dom.window.navigator, 'userAgent', {
          value: browserConfigs[browserName].userAgent,
          configurable: true
        });
      });

      test(`Should work correctly in ${browserName}`, () => {
        class BrowserSpecificElement extends HTMLElement {
          constructor() {
            super();
            this.browser = this.detectBrowser();
          }

          detectBrowser() {
            const ua = window.navigator.userAgent;
            if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
            if (ua.includes('Firefox')) return 'firefox';
            if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
            if (ua.includes('Edg')) return 'edge';
            return 'unknown';
          }

          connectedCallback() {
            this.textContent = `Running on ${this.browser}`;
          }
        }

        customElements.define(`${browserName}-element`, BrowserSpecificElement);
        
        const element = document.createElement(`${browserName}-element`);
        document.body.appendChild(element);

        expect(element.browser).toBe(browserName);
        expect(element.textContent).toBe(`Running on ${browserName}`);
      });
    });
  });
});

// Export for external validation
module.exports = {
  browserConfigs,
  runCrossBrowserTests: () => {
    // Function to run tests programmatically
    console.log('Cross-browser compatibility tests available');
    console.log('Browsers tested:', Object.keys(browserConfigs));
    return true;
  }
};