/**
 * App - Main application class
 * Coordinates components, state, and routing
 */

import { Router } from './core/router.js';
import { StateStore } from './core/state.js';

export class App {
  constructor(config = {}) {
    this.config = config;
    this.components = new Map();
    this.stores = new Map();
    this.router = null;
    
    // Global app instance
    window.__nativeApp = this;
  }
  
  // Register component
  component(name, ComponentClass) {
    if (this.components.has(name)) {
      console.warn(`Component "${name}" already registered`);
      return this;
    }
    
    // Auto-convert to kebab-case
    const tagName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Register with custom elements
    if (!customElements.get(tagName)) {
      customElements.define(tagName, ComponentClass);
    }
    
    this.components.set(name, ComponentClass);
    return this;
  }
  
  // Create store
  store(name, initialState = {}) {
    if (this.stores.has(name)) {
      return this.stores.get(name);
    }
    
    const store = new StateStore(initialState);
    this.stores.set(name, store);
    return store;
  }
  
  // Setup routing
  routing(routeConfig) {
    this.router = new Router(this.config.router || {});
    
    // Register routes
    Object.entries(routeConfig).forEach(([path, handler]) => {
      this.router.route(path, handler);
    });
    
    return this;
  }
  
  // Mount app
  mount(selector = '#app') {
    const root = document.querySelector(selector);
    if (!root) {
      console.error(`Root element "${selector}" not found`);
      return this;
    }
    
    // Add router outlet if using routing
    if (this.router && !root.querySelector('router-outlet')) {
      root.innerHTML = '<router-outlet></router-outlet>';
    }
    
    // Emit mounted event
    document.dispatchEvent(new CustomEvent('app:mounted', {
      detail: { app: this }
    }));
    
    return this;
  }
  
  // Get component
  getComponent(name) {
    return this.components.get(name);
  }
  
  // Get store
  getStore(name) {
    return this.stores.get(name);
  }
  
  // Use plugin
  use(plugin) {
    if (typeof plugin === 'function') {
      plugin(this);
    } else if (plugin && typeof plugin.install === 'function') {
      plugin.install(this);
    }
    return this;
  }
}

// Create app helper
export function createApp(config = {}) {
  return new App(config);
}