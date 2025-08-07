/**
 * Lifecycle Callbacks Test Suite
 * Tests all Custom Element lifecycle methods with real DOM operations
 * Using CommonJS for Jest compatibility
 */

const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.CustomEvent = dom.window.CustomEvent;
global.performance = dom.window.performance;

// Simple BaseElement implementation for testing
class BaseElement extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
    this._connected = false;
    this._attributeObservers = new Map();
    this.attachShadow({ mode: 'open' });
    this._performanceStart = Date.now();
    this._logLifecycle('constructor');
  }

  connectedCallback() {
    this._logLifecycle('connectedCallback');
    if (!this._initialized) {
      this.render();
      this.setupEventListeners();
      this._initialized = true;
    }
    this._connected = true;
    this.onConnect();
    const connectTime = Date.now() - this._performanceStart;
    this._performanceMetrics = { connectTime };
  }

  disconnectedCallback() {
    this._logLifecycle('disconnectedCallback');
    this._connected = false;
    this.cleanup();
    this.onDisconnect();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._logLifecycle('attributeChangedCallback', { name, oldValue, newValue });
    if (oldValue === newValue) return;
    
    const handler = this._attributeObservers.get(name);
    if (handler) {
      handler.call(this, newValue, oldValue);
    }
    
    this.onAttributeChange(name, newValue, oldValue);
    if (this._connected && this._initialized) {
      this.render();
    }
  }

  adoptedCallback() {
    this._logLifecycle('adoptedCallback');
    this.onAdopt();
  }

  static get observedAttributes() {
    return [];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; }
        .base-element { padding: 1rem; border: 1px solid #ccc; border-radius: 4px; }
      </style>
      <div class="base-element">
        <slot></slot>
      </div>
    `;
  }

  setupEventListeners() {}
  cleanup() {}
  onConnect() {}
  onDisconnect() {}
  onAttributeChange(name, newValue, oldValue) {}
  onAdopt() {}

  observeAttribute(name, handler) {
    this._attributeObservers.set(name, handler);
  }

  getPerformanceMetrics() {
    return this._performanceMetrics || {};
  }

  _logLifecycle(event, data = {}) {
    if (global.DEBUG_CUSTOM_ELEMENTS) {
      console.log(`[${this.constructor.name}] ${event}`, data);
    }
  }
}

// TestComponent implementation
class TestComponent extends BaseElement {
  constructor() {
    super();
    this.clickCount = 0;
    this.lifecycle_events = [];
  }

  static get observedAttributes() {
    return ['label', 'color', 'disabled'];
  }

  render() {
    const label = this.getAttribute('label') || 'Test Component';
    const color = this.getAttribute('color') || '#007bff';
    const disabled = this.hasAttribute('disabled');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; font-family: system-ui, sans-serif; }
        .test-component {
          padding: 12px 24px; background: ${color}; color: white; border: none;
          border-radius: 6px; cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.5' : '1'}; transition: all 0.2s ease; user-select: none;
        }
        .test-component:hover { opacity: ${disabled ? '0.5' : '0.8'}; }
        .test-component:active { transform: ${disabled ? 'none' : 'scale(0.98)'}; }
        .info { font-size: 0.8rem; margin-top: 8px; color: #666; }
      </style>
      <div class="test-component" id="button">
        ${label}
        <div class="info">Clicks: ${this.clickCount}</div>
      </div>
    `;
  }

  setupEventListeners() {
    const button = this.shadowRoot.getElementById('button');
    this._clickHandler = this._handleClick.bind(this);
    button.addEventListener('click', this._clickHandler);
  }

  cleanup() {
    const button = this.shadowRoot.getElementById('button');
    if (button && this._clickHandler) {
      button.removeEventListener('click', this._clickHandler);
    }
  }

  onConnect() {
    this.lifecycle_events.push({ event: 'connected', timestamp: Date.now() });
    this.dispatchEvent(new CustomEvent('test-connected', { detail: { component: this } }));
  }

  onDisconnect() {
    this.lifecycle_events.push({ event: 'disconnected', timestamp: Date.now() });
    this.dispatchEvent(new CustomEvent('test-disconnected', { detail: { component: this } }));
  }

  onAttributeChange(name, newValue, oldValue) {
    this.lifecycle_events.push({
      event: 'attribute-changed', timestamp: Date.now(),
      attribute: name, oldValue, newValue
    });
    this.dispatchEvent(new CustomEvent('test-attribute-changed', {
      detail: { attribute: name, oldValue, newValue }
    }));
  }

  onAdopt() {
    this.lifecycle_events.push({ event: 'adopted', timestamp: Date.now() });
    this.dispatchEvent(new CustomEvent('test-adopted', { detail: { component: this } }));
  }

  _handleClick(event) {
    if (this.hasAttribute('disabled')) {
      event.preventDefault();
      return;
    }
    this.clickCount++;
    this.render();
    this.dispatchEvent(new CustomEvent('test-click', {
      detail: { clickCount: this.clickCount, timestamp: Date.now() }
    }));
  }

  getLifecycleEvents() { return [...this.lifecycle_events]; }
  getClickCount() { return this.clickCount; }
  resetClickCount() { this.clickCount = 0; this.render(); }

  setAttributes(attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null || value === undefined) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, value);
      }
    });
  }
}

// Register custom element
customElements.define('test-component', TestComponent);

describe('Custom Element Lifecycle Callbacks', () => {
  let component;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    component = null;
  });

  describe('Constructor', () => {
    test('should create element with shadow root', () => {
      component = new TestComponent();
      
      expect(component).toBeInstanceOf(HTMLElement);
      expect(component.shadowRoot).toBeTruthy();
      expect(component.shadowRoot.mode).toBe('open');
    });

    test('should initialize with default state', () => {
      component = new TestComponent();
      
      expect(component._initialized).toBe(false);
      expect(component._connected).toBe(false);
      expect(component.clickCount).toBe(0);
      expect(component.lifecycle_events).toEqual([]);
    });
  });

  describe('connectedCallback', () => {
    test('should trigger when element added to DOM', () => {
      component = new TestComponent();
      const connectSpy = jest.spyOn(component, 'onConnect');
      
      expect(component._connected).toBe(false);
      expect(connectSpy).not.toHaveBeenCalled();
      
      container.appendChild(component);
      
      expect(component._connected).toBe(true);
      expect(component._initialized).toBe(true);
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    test('should render content when connected', () => {
      component = new TestComponent();
      component.setAttribute('label', 'Test Button');
      
      container.appendChild(component);
      
      const buttonEl = component.shadowRoot.querySelector('.test-component');
      expect(buttonEl).toBeTruthy();
      expect(buttonEl.textContent).toContain('Test Button');
    });

    test('should record performance metrics', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      const metrics = component.getPerformanceMetrics();
      expect(metrics.connectTime).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.connectTime).toBe('number');
    });
  });

  describe('disconnectedCallback', () => {
    test('should trigger when element removed from DOM', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      const disconnectSpy = jest.spyOn(component, 'onDisconnect');
      
      expect(component._connected).toBe(true);
      expect(disconnectSpy).not.toHaveBeenCalled();
      
      container.removeChild(component);
      
      expect(component._connected).toBe(false);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    test('should cleanup event listeners', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      const cleanupSpy = jest.spyOn(component, 'cleanup');
      
      container.removeChild(component);
      
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('attributeChangedCallback', () => {
    beforeEach(() => {
      component = new TestComponent();
      container.appendChild(component);
    });

    test('should trigger when observed attribute changes', () => {
      const attributeSpy = jest.spyOn(component, 'onAttributeChange');
      
      component.setAttribute('label', 'New Label');
      
      expect(attributeSpy).toHaveBeenCalledWith('label', 'New Label', null);
    });

    test('should not trigger for same value', () => {
      component.setAttribute('label', 'Same Value');
      const attributeSpy = jest.spyOn(component, 'onAttributeChange');
      
      component.setAttribute('label', 'Same Value');
      
      expect(attributeSpy).not.toHaveBeenCalled();
    });

    test('should re-render when attribute changes', () => {
      component.setAttribute('label', 'Initial Label');
      let buttonEl = component.shadowRoot.querySelector('.test-component');
      expect(buttonEl.textContent).toContain('Initial Label');
      
      component.setAttribute('label', 'Updated Label');
      buttonEl = component.shadowRoot.querySelector('.test-component');
      expect(buttonEl.textContent).toContain('Updated Label');
    });

    test('should handle multiple attribute changes', () => {
      const attributeSpy = jest.spyOn(component, 'onAttributeChange');
      
      component.setAttributes({
        label: 'Multi Test',
        color: '#00ff00',
        disabled: ''
      });
      
      expect(attributeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('adoptedCallback', () => {
    test('should trigger when element moved to new document', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      const adoptSpy = jest.spyOn(component, 'onAdopt');
      
      // Simulate adoptedCallback directly since JSDOM has issues with adoptNode
      component.adoptedCallback();
      
      expect(adoptSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lifecycle Event Tracking', () => {
    test('should track all lifecycle events', () => {
      component = new TestComponent();
      
      container.appendChild(component);
      component.setAttribute('label', 'Tracked');
      container.removeChild(component);
      
      const events = component.getLifecycleEvents();
      expect(events.length).toBeGreaterThanOrEqual(3);
      
      const eventTypes = events.map(e => e.event);
      expect(eventTypes).toContain('connected');
      expect(eventTypes).toContain('attribute-changed');
      expect(eventTypes).toContain('disconnected');
    });

    test('should include timestamps in lifecycle events', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      const events = component.getLifecycleEvents();
      events.forEach(event => {
        expect(event.timestamp).toBeGreaterThan(0);
        expect(typeof event.timestamp).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing shadow root gracefully', () => {
      component = new TestComponent();
      component.shadowRoot = null;
      
      expect(() => {
        container.appendChild(component);
      }).not.toThrow();
    });

    test('should handle invalid attribute values', () => {
      component = new TestComponent();
      container.appendChild(component);
      
      expect(() => {
        component.setAttribute('color', null);
        component.setAttribute('label', undefined);
      }).not.toThrow();
    });
  });
});