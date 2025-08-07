import { Component } from './component.js';
import { getStore } from './state.js';
import { getRouter } from './router.js';

export class EnhancedComponent extends Component {
  static variants = {};
  static responsive = true;
  static a11y = true;
  static theme = 'default';
  static connectedStore = null; // Store name to auto-connect
  static routeParams = false; // Auto-inject route params
  
  constructor(config = {}) {
    super();
    
    this.config = {
      variant: 'default',
      responsive: this.constructor.responsive,
      a11y: this.constructor.a11y,
      theme: this.constructor.theme,
      ...config
    };
    
    this.variantStyles = new Map();
    this.responsiveRules = new Map();
    this._storeUnsubscribe = null;
    this._routeParams = {};
    
    this.setupVariants();
    this.setupStoreConnection();
    this.setupRouteConnection();
  }
  
  setupVariants() {
    const variants = this.constructor.variants;
    Object.keys(variants).forEach(name => {
      this.variantStyles.set(name, variants[name]);
    });
  }
  
  setupStoreConnection() {
    const storeName = this.constructor.connectedStore;
    if (!storeName) return;
    
    const store = getStore(storeName);
    if (!store) {
      console.warn(`Store "${storeName}" not found`);
      return;
    }
    
    // Auto-sync state with store
    this._storeUnsubscribe = store.subscribe((newState, oldState) => {
      this.onStoreUpdate(newState, oldState);
      this.requestUpdate();
    });
    
    // Initial state sync
    const currentState = store.getState();
    if (currentState) {
      this.onStoreUpdate(currentState, {});
    }
  }
  
  setupRouteConnection() {
    if (!this.constructor.routeParams) return;
    
    const router = getRouter();
    if (!router) return;
    
    // Get current route params
    const currentRoute = router.getCurrentRoute();
    if (currentRoute) {
      this._routeParams = currentRoute.params || {};
      this.onRouteChange(currentRoute);
    }
    
    // Listen for route changes
    router.subscribe((route) => {
      this._routeParams = route.params || {};
      this.onRouteChange(route);
      this.requestUpdate();
    });
  }
  
  // Override in subclasses to handle store updates
  onStoreUpdate(newState, oldState) {
    // Default: merge store state into component state
    Object.assign(this._state, newState);
  }
  
  // Override in subclasses to handle route changes
  onRouteChange(route) {
    // Default: available as this._routeParams
  }
  
  generateVariant(name) {
    const variant = this.variantStyles.get(name);
    if (!variant) {
      console.warn(`Variant "${name}" not found`);
      return '';
    }
    
    const { styles, classes, attributes } = variant;
    
    if (styles) {
      Object.assign(this.style, styles);
    }
    
    if (classes) {
      this.classList.add(...classes);
    }
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.setAttribute(key, value);
      });
    }
    
    return variant;
  }
  
  applyResponsive() {
    if (!this.config.responsive) return;
    
    const breakpoints = {
      mobile: '(max-width: 640px)',
      tablet: '(min-width: 641px) and (max-width: 1024px)',
      desktop: '(min-width: 1025px)'
    };
    
    Object.entries(breakpoints).forEach(([device, query]) => {
      const mediaQuery = window.matchMedia(query);
      
      const handleChange = (e) => {
        if (e.matches) {
          this.setAttribute('data-device', device);
          this.dispatchEvent(new CustomEvent('responsive-change', {
            detail: { device, query }
          }));
        }
      };
      
      mediaQuery.addListener(handleChange);
      handleChange(mediaQuery);
      
      this.responsiveRules.set(device, { query, handler: handleChange });
    });
  }
  
  ensureA11y() {
    if (!this.config.a11y) return;
    
    const role = this.getAttribute('role');
    if (!role) {
      const tagName = this.tagName.toLowerCase();
      const roleMap = {
        'nav': 'navigation',
        'header': 'banner',
        'main': 'main',
        'footer': 'contentinfo',
        'aside': 'complementary',
        'section': 'region'
      };
      
      if (roleMap[tagName]) {
        this.setAttribute('role', roleMap[tagName]);
      }
    }
    
    const interactive = ['button', 'a', 'input', 'select', 'textarea'];
    const isInteractive = interactive.includes(this.tagName.toLowerCase()) ||
                         this.querySelector(interactive.join(','));
    
    if (isInteractive && !this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    
    if (!this.getAttribute('aria-label') && !this.getAttribute('aria-labelledby')) {
      const heading = this.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.id) {
        this.setAttribute('aria-labelledby', heading.id);
      }
    }
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    if (this.config.variant && this.config.variant !== 'default') {
      this.generateVariant(this.config.variant);
    }
    
    this.applyResponsive();
    this.ensureA11y();
    
    this.classList.add('enhanced-component');
    this.setAttribute('data-variant', this.config.variant);
    this.setAttribute('data-theme', this.config.theme);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up responsive listeners
    this.responsiveRules.forEach(({ handler }, device) => {
      const { query } = this.responsiveRules.get(device);
      window.matchMedia(query).removeListener(handler);
    });
    this.responsiveRules.clear();
    
    // Clean up store subscription
    if (this._storeUnsubscribe) {
      this._storeUnsubscribe();
      this._storeUnsubscribe = null;
    }
  }
  
  requestUpdate() {
    this.render();
  }
  
  updateVariant(variantName) {
    this.classList.remove(`variant-${this.config.variant}`);
    this.config.variant = variantName;
    this.setAttribute('data-variant', variantName);
    this.generateVariant(variantName);
    this.classList.add(`variant-${variantName}`);
  }
  
  updateTheme(themeName) {
    this.classList.remove(`theme-${this.config.theme}`);
    this.config.theme = themeName;
    this.setAttribute('data-theme', themeName);
    this.classList.add(`theme-${themeName}`);
  }
  
  // Helper to navigate programmatically
  navigate(path, options) {
    const router = getRouter();
    if (router) {
      router.navigate(path, options);
    }
  }
  
  // Helper to dispatch to store
  dispatch(storeName, updates) {
    const store = getStore(storeName);
    if (store) {
      store.setState(updates);
    }
  }
  
  static define(tagName, componentClass) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, componentClass);
    }
    return componentClass;
  }
}

// Factory function with full integration
export function createEnhancedComponent(tagName, config) {
  class CustomEnhancedComponent extends EnhancedComponent {
    static variants = config.variants || {};
    static responsive = config.responsive !== false;
    static a11y = config.a11y !== false;
    static theme = config.theme || 'default';
    static connectedStore = config.store || null;
    static routeParams = config.routeParams || false;
    
    template() {
      if (config.template) {
        return config.template.call(this);
      }
      return '';
    }
    
    styles() {
      if (config.styles) {
        return config.styles.call(this);
      }
      return '';
    }
    
    onStoreUpdate(newState, oldState) {
      if (config.onStoreUpdate) {
        config.onStoreUpdate.call(this, newState, oldState);
      } else {
        super.onStoreUpdate(newState, oldState);
      }
    }
    
    onRouteChange(route) {
      if (config.onRouteChange) {
        config.onRouteChange.call(this, route);
      } else {
        super.onRouteChange(route);
      }
    }
  }
  
  if (config.methods) {
    Object.entries(config.methods).forEach(([name, method]) => {
      CustomEnhancedComponent.prototype[name] = method;
    });
  }
  
  if (config.lifecycle) {
    Object.entries(config.lifecycle).forEach(([name, handler]) => {
      CustomEnhancedComponent.prototype[name] = handler;
    });
  }
  
  return EnhancedComponent.define(tagName, CustomEnhancedComponent);
}