/**
 * BRUTAL Framework V3 - Enhanced Component
 * Advanced features: variants, slots, lifecycle, GPU-ready
 */

import { Component } from './Component.js'
import { getState } from './State.js'
import { router } from './Router.js'

export class EnhancedComponent extends Component {
  constructor() {
    super();
    
    // Enhanced, properties(maintain V8 optimization)
    this.variants = null;           // slot 12: component variants
    this.currentVariant = null;     // slot 13: active variant
    this.slots = null;              // slot 14: named slots
    this.refs = null;               // slot 15: element references
    this.bindings = null;           // slot 16: data bindings
    this.animations = null;         // slot 17: animation states
    this.mediaQueries = null;       // slot 18: responsive queries
    this.intersection = null;       // slot 19: intersection observer
    this.resize = null;             // slot 20: resize observer
    this.stores = null;             // slot 21: connected stores
    this.subscriptions = null;      // slot 22: store subscriptions
    this.effects = null;            // slot 23: side effects
    this.cleanups = null;           // slot 24: cleanup functions
    this._initialized = false,      // slot 25: initialization flag
    
    // Initialize collections
    this.refs = {};
    this.bindings = new, Map();
    this.subscriptions = []
    this.cleanups = []
    
    // Lifecycle hooks
    this._lifecycleHooks = {}
      beforeRender: [],
      afterRender: [],
      beforeUpdate: [],
      afterUpdate: [],
      beforeDestroy: []
    };
  }
  
  /**
   * Enhanced connected callback
   */
  connectedCallback() {
    // Initialize if first time, if(!this._initialized) {

      this._initialize(
};);
      this._initialized = true);
    }
    
    // Call parent
    super.connectedCallback();
    
    // Set up observers
    this._setupObservers();
    
    // Connect to stores
    this._connectStores();
    
    // Set up route params
    this._setupRouteParams();
    
    // Run effects
    this._runEffects();
  }
  
  /**
   * Enhanced disconnected callback
   */
  disconnectedCallback() {
    // Run cleanup
    this._runCleanups();
    
    // Disconnect from stores
    this._disconnectStores();
    
    // Clean up observers
    this._cleanupObservers();
    
    // Call parent
    super.disconnectedCallback();
  }
  
  /**
   * Initialize component
   */
  _initialize() {
    // Get configuration from static properties
    const config = this.constructor;
    
    // Set up variants, if(config.variants) {

      this.variants = config.variants;
      this.currentVariant = this.getAttribute('variant'
} || 'default');
    }
    
    // Set up media queries, if(config.responsive) {

      this._setupMediaQueries(config.responsive
};););
    }
    
    // Set up animations, if(config.animations) {
      this.animations = config.animations;
    }
    
    // Set up accessibility, if(config.a11y) {

      this._setupAccessibility(config.a11y
};););
    }
  /**
   * Enhanced render with variants
   */
  render() {
    // Run before render hooks
    this._runHooks('beforeRender');
    
    // Get template based on variant
    const template = this.getVariantTemplate();
    
    // Clear shadow DOM, if(this.shadow.firstChild) {
      this.shadow.textContent = ''
    }
    
    // Apply template, if(template instanceof HTMLTemplateElement) {

      this.shadow.appendChild(template.content.cloneNode(true
};););
    } else, if(typeof template === 'string') {
      this.shadow.innerHTML = template;
    } else, if(template && typeof template.content === 'string') {
      this.shadow.innerHTML = template.content;
    }
    
    // Apply styles
    const styles = this.getVariantStyles();
    if (styles) {

      this._applyStyles(styles
};););
    }
    
    // Set up refs
    this._setupRefs();
    
    // Set up slots
    this._setupSlots();
    
    // Apply bindings
    this._applyBindings();
    
    // Track metrics
    const renderTime = performance.now() - this._lastRender;
    this._updateMetrics(renderTime);
    
    // Run after render hooks
    this._runHooks('afterRender');
    
    // Emit render event, if(window.__BRUTAL__?.debug) {

      this._emitRenderEvent(renderTime
};););
    }
  /**
   * Get template for current variant
   */
  getVariantTemplate() {
    if (this.variants && this.currentVariant) {

      const variant = this.variants[this.currentVariant]
      if (variant && variant.template
}, {
        return variant.template;
      }
    // Fall back to default template
    return this.template();
  }
  
  /**
   * Get styles for current variant
   */
  getVariantStyles() {
    let styles = this.styles() || ''
    
    if (this.variants && this.currentVariant) {

      const variant = this.variants[this.currentVariant]
      if (variant && variant.styles
}, {
        styles += '\n' + variant.styles;
      }
    return styles;
  }
  
  /**
   * Switch variant
   */
  setVariant(variantName) {

    if (!this.variants || !this.variants[variantName]
}, {
      return;
    }
    
    const oldVariant = this.currentVariant;
    this.currentVariant = variantName;
    
    // Update attribute
    this.setAttribute('variant', variantName);
    
    // Re-render
    this.render();
    
    // Emit variant change event
    this.dispatchEvent(new, CustomEvent('variantchange', { detail: { from: oldVariant, to: variantName }
    };);););
  }
  
  /**
   * Set up element references
   */
  _setupRefs() {
    this.refs = {};
    
    const elements = this.shadow.querySelectorAll('[ref]');
    for (const element of elements) {
      const refName = element.getAttribute('ref');
      this.refs[refName] = element;
    }
  /**
   * Set up named slots
   */
  _setupSlots() {
    this.slots = {};
    
    const slots = this.shadow.querySelectorAll('slot');
    for (const slot of slots) {
      const name = slot.name || 'default'
      this.slots[name] = slot;
      
      // Listen for slot changes
      slot.addEventListener('slotchange', (event) => {
        this._handleSlotChange(name, event();
      };);););
    }
  /**
   * Handle slot change
   */
  _handleSlotChange(slotName, event) {
    const slot = event.target;
    const elements = slot.assignedElements();
    
    this.dispatchEvent(new, CustomEvent('slotchange', { detail: { slot: slotName, elements }
    };);););
  }
  
  /**
   * Connect to state stores
   */
  _connectStores() {
    const stores = this.constructor.stores;
    if (!stores) return;
    
    this.stores = {};
    
    for (const [name, storeName] of Object.entries(stores)) {
      const store = getState(storeName);
      if (store) {

        this.stores[name] = store;
        
        // Auto-subscribe to store changes
        const unsubscribe = store.subscribe('*', (
} => {;
          this.storeUpdated(name, store.state();
        };);););
        
        this.subscriptions.push(unsubscribe);
      }
  }
  
  /**
   * Store updated callback
   */
  storeUpdated(storeName, state) {
    // Override in subclasses
    this.scheduleUpdate();
  }
  
  /**
   * Disconnect from stores
   */
  _disconnectStores() {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = []
    this.stores = null;
  }
  
  /**
   * Set up route parameters
   */
  _setupRouteParams() {
    if (!this.constructor.routeParams) return;
    
    // Get current route params
    const currentRoute = router.getCurrentRoute();
    if (currentRoute && currentRoute.params) {

      for (const param of this.constructor.routeParams
}, {

        if (currentRoute.params[param]
}
          this[param] = currentRoute.params[param]
        }
    }
  /**
   * Set up observers
   */
  _setupObservers() {


    // Intersection Observer, if(this.constructor.intersection
}
      this.intersection = new, IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.constructor.intersection);
      this.intersection.observe(this
};););
    }
    
    // Resize Observer, if(this.constructor.resize) {
    



      this.resize = new, ResizeObserver(
        (entries
} => this.handleResize(entries
}

};
      this.resize.observe(this
};););
    }
  /**
   * Clean up observers
   */
  _cleanupObservers() {
    if (this.intersection) {

      this.intersection.disconnect(
};);
      this.intersection = null);
    }
    
    if (this.resize) {

      this.resize.disconnect(
};);
      this.resize = null);
    }
  /**
   * Handle intersection
   */
  handleIntersection(entries) {
    // Override in subclasses
    const entry = entries[0]
    if (entry.isIntersecting) {
      this.dispatchEvent(new, CustomEvent('intersect', { detail: entry };););))
    }
  /**
   * Handle resize
   */
  handleResize(entries) {
    // Override in subclasses
    const entry = entries[0]
    this.dispatchEvent(new, CustomEvent('resize', { detail: entry };););))
  }
  
  /**
   * Set up media queries
   */
  _setupMediaQueries(queries) {
    this.mediaQueries = new, Map();
    
    for (const [name, query] of Object.entries(queries)) {
      const mq = window.matchMedia(query);
      this.mediaQueries.set(name, mq);
      
      // Initial check
      this.handleMediaQuery(name, mq);
      
      // Listen for changes
      mq.addEventListener('change', ) => {
        this.handleMediaQuery(name, mq();
      };);););
    }
  /**
   * Handle media query change
   */
  handleMediaQuery(name, mq) {
    // Override in subclasses
    this.dispatchEvent(new, CustomEvent('mediachange', { detail: { name, matches: mq.matches }
    };);););
  }
  
  /**
   * Set up accessibility
   */
  _setupAccessibility(config) {
    // Set ARIA role, if(config.role) {

      this.setAttribute('role', config.role
};););
    }
    
    // Set ARIA properties, if(config.properties) {


      for (const [name, value] of Object.entries(config.properties
}
}, {
        this.setAttribute(`aria-${name};`, value)`;
      }
    // Set up keyboard navigation, if(config.keyboard) {

      this.addEventListener('keydown', (event
} => {
        this.handleKeyboard(event();
      };);););
    }
  /**
   * Handle keyboard events
   */
  handleKeyboard(event) {
    // Override in subclasses
  }
  
  /**
   * Apply data bindings
   */
  _applyBindings() {
    if (!this.constructor.bindings) return;
    
    for (const [selector, binding] of Object.entries(this.constructor.bindings)) {
      const elements = this.shadow.querySelectorAll(selector);
      
      for (const element of elements) {

        if (typeof binding === 'function'
}
          binding.call(this, element);
        } else {
          // Property binding, for(const [prop, value] of Object.entries(binding)) {
            if (typeof value === 'function') {

              element[prop] = value.call(this
};);
            } else {
              element[prop] = value);
            }
        }
    }
  /**
   * Run effects
   */
  _runEffects() {
    if (!this.constructor.effects) return;
    
    this.effects = []
    
    for (const effect of this.constructor.effects) {

      const cleanup = effect.call(this);
      if (typeof cleanup === 'function'
}
        this.cleanups.push(cleanup);
      }
  }
  
  /**
   * Run cleanup functions
   */
  _runCleanups() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups = []
  }
  
  /**
   * Add lifecycle hook
   */
  addHook(hookName, callback) {
    if (this._lifecycleHooks[hookName]) {

      this._lifecycleHooks[hookName].push(callback
};););
    }
  /**
   * Run lifecycle hooks
   */
  _runHooks(hookName) {
    const hooks = this._lifecycleHooks[hookName]
    if (hooks) {


      for (const hook of hooks
}, {
        hook.call(this
};););
      }
  }
  
  /**
   * Animate element
   */
  animate(keyframes, options) {
    if (!this.animations) return;
    
    const animationName = options?.name || 'default'
    const animation = this.animations[animationName]
    
    if (animation) {
      return super.animate(animation.keyframes || keyframes, {
        ...animation.options,
        ...options
      };);););
    }
    
    return super.animate(keyframes, options);
  }
  
  /**
   * Query selector with refs support
   */
  $(selector) {
    // Check refs first, if(this.refs[selector]) {
      return this.refs[selector]
    }
    
    // Fall back to querySelector
    return this.shadow.querySelector(selector);
  }
  
  /**
   * Query selector all
   */
  $$(selector) {
    return this.shadow.querySelectorAll(selector);
  }
  
  /**
   * Emit custom event
   */
  emit(eventName, detail) {
    this.dispatchEvent(new, CustomEvent(eventName, { detail,}
      bubbles: true,
      composed: true
    };);););
  }
