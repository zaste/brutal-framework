/**
 * Lifecycle Callbacks Test Suite
 * Tests all Custom Element lifecycle methods with real DOM operations
 */

// Mock DOM environment for Node.js testing
import { JSDOM } from 'jsdom';

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

// Import components after DOM setup
import BaseElement from '../src/base-element.js';
import TestComponent from '../src/test-component.js';

describe('Custom Element Lifecycle Callbacks', () => {
  let component;
  let container;

  beforeEach(() => {
    // Create fresh container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup after each test
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
    test('should trigger when element added to DOM', async () => {
      component = new TestComponent();
      const connectSpy = jest.spyOn(component, 'onConnect');
      
      // Element not connected yet
      expect(component._connected).toBe(false);
      expect(connectSpy).not.toHaveBeenCalled();
      
      // Add to DOM
      container.appendChild(component);
      
      // Should be connected now
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

    test('should emit connected event', (done) => {
      component = new TestComponent();
      
      component.addEventListener('test-connected', (event) => {
        expect(event.detail.component).toBe(component);
        done();
      });
      
      container.appendChild(component);
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
      
      // Element connected
      expect(component._connected).toBe(true);
      expect(disconnectSpy).not.toHaveBeenCalled();
      
      // Remove from DOM
      container.removeChild(component);
      
      // Should be disconnected
      expect(component._connected).toBe(false);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    test('should emit disconnected event', (done) => {
      component = new TestComponent();
      container.appendChild(component);
      
      component.addEventListener('test-disconnected', (event) => {
        expect(event.detail.component).toBe(component);
        done();
      });
      
      container.removeChild(component);
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

    test('should emit attribute changed event', (done) => {
      component.addEventListener('test-attribute-changed', (event) => {
        expect(event.detail.attribute).toBe('color');
        expect(event.detail.newValue).toBe('#ff0000');
        expect(event.detail.oldValue).toBe(null);
        done();
      });
      
      component.setAttribute('color', '#ff0000');
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
      // Create new document
      const newDoc = new JSDOM(`<!DOCTYPE html><html><body></body></html>`).window.document;
      
      component = new TestComponent();
      container.appendChild(component);
      
      const adoptSpy = jest.spyOn(component, 'onAdopt');
      
      // Adopt to new document
      const adoptedNode = newDoc.adoptNode(component);
      
      expect(adoptSpy).toHaveBeenCalledTimes(1);
      expect(adoptedNode).toBe(component);
    });

    test('should emit adopted event', (done) => {
      const newDoc = new JSDOM(`<!DOCTYPE html><html><body></body></html>`).window.document;
      
      component = new TestComponent();
      container.appendChild(component);
      
      component.addEventListener('test-adopted', (event) => {
        expect(event.detail.component).toBe(component);
        done();
      });
      
      newDoc.adoptNode(component);
    });
  });

  describe('Lifecycle Event Tracking', () => {
    test('should track all lifecycle events', () => {
      component = new TestComponent();
      
      // Connect
      container.appendChild(component);
      
      // Change attribute
      component.setAttribute('label', 'Tracked');
      
      // Disconnect
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