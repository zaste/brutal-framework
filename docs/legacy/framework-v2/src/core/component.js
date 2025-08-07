/**
 * Component - Base class for Native Web Components
 * No inheritance chains, clean architecture
 */

export class Component extends HTMLElement {
  constructor() {
    super();
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Internal state
    this._state = {};
    this._initialized = false;
    
    // Performance tracking
    this._metrics = {
      created: performance.now(),
      renders: 0
    };
  }
  
  // Lifecycle: Connected
  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this.init();
    }
    this.render();
  }
  
  // Lifecycle: Disconnected
  disconnectedCallback() {
    this.cleanup();
  }
  
  // Initialize component (override in subclasses)
  init() {
    // Override this method
  }
  
  // Cleanup (override in subclasses)
  cleanup() {
    // Override this method
  }
  
  // Get template (override in subclasses)
  template() {
    return '<div>Component</div>';
  }
  
  // Get styles (override in subclasses)  
  styles() {
    return '';
  }
  
  // Render component
  render() {
    const start = performance.now();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ${this.styles()}
      </style>
      ${this.template()}
    `;
    
    this._metrics.renders++;
    this._metrics.lastRender = performance.now() - start;
    
    this.afterRender();
  }
  
  // After render hook
  afterRender() {
    // Override this method
  }
  
  // Update state and re-render
  setState(updates) {
    Object.assign(this._state, updates);
    this.render();
  }
  
  // Get current state
  get state() {
    return { ...this._state };
  }
  
  // Emit custom event
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
  
  // Query element in shadow DOM
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  
  // Query all elements in shadow DOM
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  
  // Get performance metrics
  getMetrics() {
    return {
      ...this._metrics,
      lifetime: performance.now() - this._metrics.created
    };
  }
}

// Helper to define custom element
export function defineComponent(name, ComponentClass) {
  if (!customElements.get(name)) {
    customElements.define(name, ComponentClass);
  }
  return ComponentClass;
}