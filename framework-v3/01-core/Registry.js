/**
 * BRUTAL Framework V3 - Component Registry
 * Manages custom element registration and lazy loading
 */

import { BRUTAL_EVENTS, emitBrutalEvent } from './events.js';

export class ComponentRegistry {
  constructor() {
    // Component definitions
    this.definitions = new Map();
    
    // Lazy loading promises
    this.loadingPromises = new Map();
    
    // Component instances
    this.instances = new WeakMap();
    
    // Pending registrations
    this.pendingRegistrations = new Map();
    
    // Performance metrics
    this._metrics = {
      registered: 0,
      lazyLoaded: 0,
      avgLoadTime: 0
    };
    
    // Set up mutation observer for lazy loading
    this._setupObserver();
  }
  
  /**
   * Register a component
   */
  register(name, ComponentClass, options = {}) {
    // Validate name
    if (!this._isValidName(name)) {
      throw new Error(`Invalid component name: ${name}. Must contain a hyphen.`);
    }
    
    // Check if already registered
    if (customElements.get(name)) {
      return this;
    }
    
    // Store definition
    this.definitions.set(name, {
      class: ComponentClass,
      options,
      lazy: options.lazy || false,
      loaded: !options.lazy
    });
    
    // Register immediately if not lazy
    if (!options.lazy) {
      this._registerElement(name, ComponentClass);
    }
    
    this._metrics.registered++;
    
    return this;
  }
  
  /**
   * Register multiple components
   */
  registerAll(components) {
    for (const [name, ComponentClass] of Object.entries(components)) {
      this.register(name, ComponentClass);
    }
    return this;
  }
  
  /**
   * Lazy register a component
   */
  lazy(name, loader, options = {}) {
    // Validate name
    if (!this._isValidName(name)) {
      throw new Error(`Invalid component name: ${name}`);
    }
    
    // Store lazy definition
    this.definitions.set(name, {
      loader,
      options: { ...options, lazy: true },
      lazy: true,
      loaded: false
    });
    
    return this;
  }
  
  /**
   * Get component definition
   */
  get(name) {
    return this.definitions.get(name);
  }
  
  /**
   * Check if component is registered
   */
  has(name) {
    return this.definitions.has(name) || customElements.get(name) !== undefined;
  }
  
  /**
   * Load a lazy component
   */
  async load(name) {
    const definition = this.definitions.get(name);
    
    if (!definition) {
      throw new Error(`Component ${name} not found`);
    }
    
    if (definition.loaded) {
      return definition.class;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    // Start loading
    const start = performance.now();
    
    const loadingPromise = (async () => {
      try {
        // Execute loader
        const module = await definition.loader();
        
        // Extract component class
        const ComponentClass = module.default || module[name] || module;
        
        if (!ComponentClass) {
          throw new Error(`No component found in module for ${name}`);
        }
        
        // Update definition
        definition.class = ComponentClass;
        definition.loaded = true;
        
        // Register element
        this._registerElement(name, ComponentClass);
        
        // Update metrics
        const loadTime = performance.now() - start;
        this._updateLoadMetrics(loadTime);
        
        // Clear loading promise
        this.loadingPromises.delete(name);
        
        return ComponentClass;
        
      } catch (error) {
        this.loadingPromises.delete(name);
        throw new Error(`Failed to load component ${name}: ${error.message}`);
      }
    })();
    
    this.loadingPromises.set(name, loadingPromise);
    
    return loadingPromise;
  }
  
  /**
   * Load all components matching a pattern
   */
  async loadAll(pattern) {
    const regex = new RegExp(pattern);
    const promises = [];
    
    for (const [name, definition] of this.definitions) {
      if (regex.test(name) && definition.lazy && !definition.loaded) {
        promises.push(this.load(name));
      }
    }
    
    return Promise.all(promises);
  }
  
  /**
   * Upgrade elements already in DOM
   */
  upgrade(root = document.body) {
    // Find all unregistered custom elements
    const elements = root.querySelectorAll(':not(:defined)');
    
    for (const element of elements) {
      const name = element.localName;
      
      if (this.definitions.has(name)) {
        // Load if lazy
        const definition = this.definitions.get(name);
        if (definition.lazy && !definition.loaded) {
          this.load(name);
        }
      }
    }
  }
  
  /**
   * Create component instance
   */
  create(name, props = {}) {
    const definition = this.definitions.get(name);
    
    if (!definition || !definition.loaded) {
      throw new Error(`Component ${name} not loaded`);
    }
    
    const element = new definition.class();
    
    // Set properties
    for (const [key, value] of Object.entries(props)) {
      element[key] = value;
    }
    
    // Track instance
    this.instances.set(element, {
      name,
      created: Date.now()
    });
    
    return element;
  }
  
  /**
   * Define custom element behavior
   */
  define(name, definition) {
    // Create class from definition
    const ComponentClass = this._createComponentClass(definition);
    
    // Register
    this.register(name, ComponentClass, definition.options);
    
    return this;
  }
  
  /**
   * Create component class from definition
   */
  _createComponentClass(definition) {
    const BaseClass = definition.extends || HTMLElement;
    
    return class extends BaseClass {
      constructor() {
        super();
        
        // Apply mixins
        if (definition.mixins) {
          for (const mixin of definition.mixins) {
            Object.assign(this, mixin);
          }
        }
        
        // Set properties
        if (definition.properties) {
          for (const [key, value] of Object.entries(definition.properties)) {
            this[key] = value;
          }
        }
        
        // Shadow DOM
        if (definition.shadow) {
          this.attachShadow({ mode: 'open' });
        }
      }
      
      // Lifecycle
      connectedCallback() {
        if (definition.connected) {
          definition.connected.call(this);
        }
      }
      
      disconnectedCallback() {
        if (definition.disconnected) {
          definition.disconnected.call(this);
        }
      }
      
      attributeChangedCallback(name, oldValue, newValue) {
        if (definition.attributeChanged) {
          definition.attributeChanged.call(this, name, oldValue, newValue);
        }
      }
      
      // Observed attributes
      static get observedAttributes() {
        return definition.observedAttributes || [];
      }
    };
  }
  
  /**
   * Register element with custom elements
   */
  _registerElement(name, ComponentClass) {
    try {
      customElements.define(name, ComponentClass);
      
      // Process pending registrations
      if (this.pendingRegistrations.has(name)) {
        const callbacks = this.pendingRegistrations.get(name);
        for (const callback of callbacks) {
          callback();
        }
        this.pendingRegistrations.delete(name);
      }
      
      // Emit registration event
      if (window.__BRUTAL__?.debug) {
        emitBrutalEvent(window, BRUTAL_EVENTS.COMPONENT_REGISTERED, {
          name, 
          class: ComponentClass.name
        });
      }
      
    } catch (error) {
      throw new Error(`Failed to register ${name}: ${error.message}`);
    }
  }
  
  /**
   * Validate component name
   */
  _isValidName(name) {
    return typeof name === 'string' && name.includes('-');
  }
  
  /**
   * Set up mutation observer for lazy loading
   */
  _setupObserver() {
    if (typeof MutationObserver === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this._checkElement(node);
          }
        }
      }
    });
    
    // Start observing when first lazy component is registered
    let observing = false;
    
    const originalLazy = this.lazy.bind(this);
    this.lazy = function(...args) {
      const result = originalLazy(...args);
      
      if (!observing) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        observing = true;
      }
      
      return result;
    };
  }
  
  /**
   * Check element for lazy loading
   */
  _checkElement(element) {
    const name = element.localName;
    
    // Check if it's a custom element that needs loading
    if (name.includes('-') && !customElements.get(name)) {
      const definition = this.definitions.get(name);
      
      if (definition && definition.lazy && !definition.loaded) {
        // Load component
        this.load(name).catch(error => {
          });
      }
    }
    
    // Check children
    if (element.children.length > 0) {
      this.upgrade(element);
    }
  }
  
  /**
   * Update load metrics
   */
  _updateLoadMetrics(loadTime) {
    this._metrics.lazyLoaded++;
    this._metrics.avgLoadTime = 
      (this._metrics.avgLoadTime * (this._metrics.lazyLoaded - 1) + loadTime) 
      / this._metrics.lazyLoaded;
  }
  
  /**
   * When defined promise
   */
  whenDefined(name) {
    // Check if already defined
    if (customElements.get(name)) {
      return Promise.resolve();
    }
    
    // Check if loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    // Wait for definition
    return new Promise((resolve) => {
      if (!this.pendingRegistrations.has(name)) {
        this.pendingRegistrations.set(name, []);
      }
      this.pendingRegistrations.get(name).push(resolve);
      
      // Try to load if lazy
      const definition = this.definitions.get(name);
      if (definition && definition.lazy && !definition.loaded) {
        this.load(name);
      }
    });
  }
  
  /**
   * Get all registered component names
   */
  getNames() {
    return Array.from(this.definitions.keys());
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this._metrics };
  }
  
  /**
   * Clear registry
   */
  clear() {
    this.definitions.clear();
    this.loadingPromises.clear();
    this.pendingRegistrations.clear();
  }
}

// Create global registry
export const registry = new ComponentRegistry();

// Export convenience methods
export const register = registry.register.bind(registry);
export const lazy = registry.lazy.bind(registry);
export const define = registry.define.bind(registry);