/**
 * BaseElement - Custom Element with complete lifecycle implementation
 * Evidence-based implementation following Web Components v1 specification
 */

class BaseElement extends HTMLElement {
  constructor() {
    super();
    
    // Track initialization state
    this._initialized = false;
    this._connected = false;
    this._attributeObservers = new Map();
    
    // Create shadow root for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Performance tracking
    this._performanceStart = performance.now();
    
    // Debug logging for lifecycle tracking
    this._logLifecycle('constructor');
  }

  /**
   * Lifecycle: Element added to DOM
   */
  connectedCallback() {
    this._logLifecycle('connectedCallback');
    
    if (!this._initialized) {
      this.render();
      this.setupEventListeners();
      this._initialized = true;
    }
    
    this._connected = true;
    this.onConnect();
    
    // Performance measurement
    const connectTime = performance.now() - this._performanceStart;
    this._performanceMetrics = { connectTime };
  }

  /**
   * Lifecycle: Element removed from DOM
   */
  disconnectedCallback() {
    this._logLifecycle('disconnectedCallback');
    
    this._connected = false;
    this.cleanup();
    this.onDisconnect();
  }

  /**
   * Lifecycle: Attribute changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    this._logLifecycle('attributeChangedCallback', { name, oldValue, newValue });
    
    // Skip if values are the same
    if (oldValue === newValue) return;
    
    // Call attribute-specific handler if it exists
    const handler = this._attributeObservers.get(name);
    if (handler) {
      handler.call(this, newValue, oldValue);
    }
    
    // Call generic handler
    this.onAttributeChange(name, newValue, oldValue);
    
    // Re-render if connected
    if (this._connected && this._initialized) {
      this.render();
    }
  }

  /**
   * Lifecycle: Element moved to new document
   */
  adoptedCallback() {
    this._logLifecycle('adoptedCallback');
    this.onAdopt();
  }

  /**
   * Define which attributes to observe
   * Override in subclasses
   */
  static get observedAttributes() {
    return [];
  }

  /**
   * Render the component
   * Override in subclasses
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        .base-element {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      </style>
      <div class="base-element">
        <slot></slot>
      </div>
    `;
  }

  /**
   * Setup event listeners
   * Override in subclasses
   */
  setupEventListeners() {
    // Default implementation - override in subclasses
  }

  /**
   * Cleanup resources
   * Override in subclasses
   */
  cleanup() {
    // Remove event listeners, clear timers, etc.
    // Default implementation - override in subclasses
  }

  /**
   * Register attribute observer
   */
  observeAttribute(name, handler) {
    this._attributeObservers.set(name, handler);
  }

  /**
   * Hook: Called when element connects to DOM
   * Override in subclasses
   */
  onConnect() {
    // Override in subclasses
  }

  /**
   * Hook: Called when element disconnects from DOM
   * Override in subclasses
   */
  onDisconnect() {
    // Override in subclasses
  }

  /**
   * Hook: Called when attribute changes
   * Override in subclasses
   */
  onAttributeChange(name, newValue, oldValue) {
    // Override in subclasses
  }

  /**
   * Hook: Called when element is adopted to new document
   * Override in subclasses
   */
  onAdopt() {
    // Override in subclasses
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this._performanceMetrics || {};
  }

  /**
   * Internal: Log lifecycle events for debugging
   */
  _logLifecycle(event, data = {}) {
    if (window.DEBUG_CUSTOM_ELEMENTS) {
      console.log(`[${this.constructor.name}] ${event}`, data);
    }
  }
}

export default BaseElement;