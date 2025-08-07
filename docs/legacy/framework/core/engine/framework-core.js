/**
 * 🏗️ PHASE III - NATIVE FRAMEWORK CORE
 * Unified Native Web Components Framework
 * 
 * Integrates all systems into cohesive framework:
 * - Component base class with optimizations
 * - State management with reactivity
 * - Client-side routing
 * - Performance monitoring
 * - Development tools
 */

import { NativeComponent } from '../systems/component-base.js';
import { NativeStateStore, ComponentStateMixin, globalStateManager } from '../systems/state-manager.js';
import { NativeRouter, createRouter, getRouter } from '../systems/router.js';

/**
 * 🎯 NATIVE FRAMEWORK
 * Main framework class orchestrating all systems
 */
class NativeFramework {
  constructor(options = {}) {
    this.version = '1.0.0-alpha';
    this.components = new Map();
    this.plugins = new Map();
    this.config = {
      enableRouter: options.enableRouter !== false,
      enableStateManagement: options.enableStateManagement !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
      enableDevTools: options.enableDevTools !== false,
      routerOptions: options.routerOptions || {},
      performanceTargets: options.performanceTargets || {},
      ...options
    };
    
    // Framework state
    this.state = new NativeStateStore({
      initialized: false,
      componentsRegistered: 0,
      routesRegistered: 0,
      performanceMetrics: {},
      errors: []
    });
    
    // Performance monitoring
    this.performanceMonitor = new FrameworkPerformanceMonitor();
    
    // Initialize framework
    this._initialize();
  }
  
  /**
   * 🔧 Initialize framework
   */
  _initialize() {
    const startTime = performance.now();
    
    try {
      // Initialize router if enabled
      if (this.config.enableRouter) {
        this.router = createRouter(this.config.routerOptions);
        this._setupRouterIntegration();
      }
      
      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.start();
      }
      
      // Initialize dev tools
      if (this.config.enableDevTools && typeof window !== 'undefined') {
        this._setupDevTools();
      }
      
      // Mark as initialized
      this.state.setState({ 
        initialized: true,
        initializationTime: performance.now() - startTime
      });
      
      console.log(`[NativeFramework] Initialized v${this.version} in ${(performance.now() - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('[NativeFramework] Initialization error:', error);
      this._handleError(error);
    }
  }
  
  /**
   * 🧩 Register component
   */
  component(name, componentClass, options = {}) {
    try {
      // Validate component class
      if (!componentClass.prototype || !componentClass.prototype.connectedCallback) {
        throw new Error(`Invalid component class for "${name}"`);
      }
      
      // Create enhanced component class
      const EnhancedComponent = this._enhanceComponent(componentClass, options);
      
      // Convert name to kebab-case
      const tagName = name.toLowerCase().replace(/([A-Z])/g, '-$1');
      
      // Register with Custom Elements
      if (!customElements.get(tagName)) {
        customElements.define(tagName, EnhancedComponent);
        
        // Store component metadata
        this.components.set(tagName, {
          name,
          tagName,
          componentClass: EnhancedComponent,
          options,
          registeredAt: Date.now()
        });
        
        // Update state
        this.state.setState({ 
          componentsRegistered: this.components.size 
        });
        
        console.log(`[NativeFramework] Registered component: ${tagName}`);
        
      } else {
        console.warn(`[NativeFramework] Component already registered: ${tagName}`);
      }
      
      return this;
      
    } catch (error) {
      console.error(`[NativeFramework] Component registration error for "${name}":`, error);
      this._handleError(error);
      return this;
    }
  }
  
  /**
   * ⚡ Enhance component with framework features
   */
  _enhanceComponent(ComponentClass, options) {
    return class extends ComponentClass {
      constructor() {
        super();
        
        // Add framework features
        if (options.enableState !== false) {
          Object.assign(this, new ComponentStateMixin());
        }
        
        // Add router integration
        if (options.enableRouter !== false && this.framework?.router) {
          this._routerData = null;
        }
        
        // Add performance monitoring
        this._frameworkMetrics = {
          creationTime: performance.now(),
          renderCount: 0,
          updateCount: 0
        };
        
        // Store framework reference
        this.framework = globalFramework;
      }
      
      connectedCallback() {
        const startTime = performance.now();
        
        // Call original connected callback
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        
        // Track performance
        this._frameworkMetrics.connectionTime = performance.now() - startTime;
        
        // Emit framework event
        this.dispatchEvent(new CustomEvent('framework:component-connected', {
          detail: { component: this, metrics: this._frameworkMetrics },
          bubbles: true
        }));
      }
      
      disconnectedCallback() {
        // Cleanup framework features
        if (this._cleanupState) {
          this._cleanupState();
        }
        
        // Call original disconnected callback
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
        
        // Emit framework event
        this.dispatchEvent(new CustomEvent('framework:component-disconnected', {
          detail: { component: this },
          bubbles: true
        }));
      }
      
      // Router data setter
      setRouteData(data) {
        this._routerData = data;
        if (this.onRouteChange) {
          this.onRouteChange(data);
        }
      }
      
      // Performance tracking
      _trackRender() {
        this._frameworkMetrics.renderCount++;
        this._frameworkMetrics.lastRenderTime = performance.now();
      }
      
      _trackUpdate() {
        this._frameworkMetrics.updateCount++;
        this._frameworkMetrics.lastUpdateTime = performance.now();
      }
    };
  }
  
  /**
   * 🛣️ Register route
   */
  route(path, component, options = {}) {
    if (!this.router) {
      console.warn('[NativeFramework] Router not enabled');
      return this;
    }
    
    this.router.route(path, component, options);
    
    // Update state
    this.state.setState({ 
      routesRegistered: this.router.routes.size 
    });
    
    return this;
  }
  
  /**
   * 🧭 Navigate
   */
  navigate(path, options = {}) {
    if (!this.router) {
      console.warn('[NativeFramework] Router not enabled');
      return Promise.reject(new Error('Router not enabled'));
    }
    
    return this.router.navigate(path, options);
  }
  
  /**
   * 🔌 Use plugin
   */
  use(plugin, options = {}) {
    try {
      if (typeof plugin === 'function') {
        plugin(this, options);
      } else if (plugin && typeof plugin.install === 'function') {
        plugin.install(this, options);
      } else {
        throw new Error('Invalid plugin format');
      }
      
      // Store plugin metadata
      const pluginName = plugin.name || plugin.constructor.name || 'anonymous';
      this.plugins.set(pluginName, {
        plugin,
        options,
        installedAt: Date.now()
      });
      
      console.log(`[NativeFramework] Installed plugin: ${pluginName}`);
      
    } catch (error) {
      console.error('[NativeFramework] Plugin installation error:', error);
      this._handleError(error);
    }
    
    return this;
  }
  
  /**
   * 🏪 Get global state store
   */
  getStore(name) {
    return globalStateManager.getStore(name);
  }
  
  /**
   * 🏪 Create state store
   */
  createStore(name, initialState = {}) {
    return globalStateManager.createStore(name, initialState);
  }
  
  /**
   * 🔧 Setup router integration
   */
  _setupRouterIntegration() {
    if (!this.router) return;
    
    // Listen to route changes
    document.addEventListener('router:navigate', (event) => {
      const { detail: route } = event;
      this.state.setState({ currentRoute: route });
    });
    
    // Listen to navigation errors
    document.addEventListener('router:navigation-error', (event) => {
      const { detail: { error, path } } = event;
      console.error(`[NativeFramework] Navigation error for ${path}:`, error);
      this._handleError(error);
    });
  }
  
  /**
   * 🛠️ Setup development tools
   */
  _setupDevTools() {
    // Add framework to global scope for debugging
    window.__NATIVE_FRAMEWORK__ = this;
    
    // Performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this._setupPerformanceDevTools();
    }
    
    // Component inspector
    this._setupComponentInspector();
    
    console.log('[NativeFramework] Dev tools enabled');
  }
  
  /**
   * 📊 Setup performance dev tools
   */
  _setupPerformanceDevTools() {
    // Performance observer for framework events
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.startsWith('framework:')) {
          this.performanceMonitor.addMetric(entry.name, entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  /**
   * 🔍 Setup component inspector
   */
  _setupComponentInspector() {
    // Add data attributes for debugging
    document.addEventListener('framework:component-connected', (event) => {
      const { component } = event.detail;
      component.setAttribute('data-framework-component', component.constructor.name);
      component.setAttribute('data-framework-id', component._componentId || '');
    });
  }
  
  /**
   * ❌ Handle framework errors
   */
  _handleError(error) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };
    
    // Add to error list
    const currentErrors = this.state.getState().errors;
    this.state.setState({ 
      errors: [...currentErrors, errorData].slice(-10) // Keep last 10 errors
    });
    
    // Emit error event
    document.dispatchEvent(new CustomEvent('framework:error', {
      detail: { error: errorData },
      bubbles: true
    }));
  }
  
  /**
   * 📊 Get framework metrics
   */
  getMetrics() {
    return {
      framework: this.state.getState(),
      router: this.router?.getPerformanceMetrics(),
      stateManager: globalStateManager.getGlobalMetrics(),
      performance: this.performanceMonitor.getMetrics(),
      components: Array.from(this.components.values()),
      plugins: Array.from(this.plugins.values())
    };
  }
  
  /**
   * 🧹 Cleanup framework
   */
  destroy() {
    // Cleanup router
    if (this.router) {
      this.router.destroy();
    }
    
    // Stop performance monitoring
    this.performanceMonitor.stop();
    
    // Clear components and plugins
    this.components.clear();
    this.plugins.clear();
    
    console.log('[NativeFramework] Framework destroyed');
  }
}

/**
 * 📊 FRAMEWORK PERFORMANCE MONITOR
 * Tracks framework performance metrics
 */
class FrameworkPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isActive = false;
    this.startTime = 0;
  }
  
  start() {
    this.isActive = true;
    this.startTime = performance.now();
    
    // Monitor Core Web Vitals
    this._monitorWebVitals();
  }
  
  stop() {
    this.isActive = false;
  }
  
  addMetric(name, value) {
    if (!this.isActive) return;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });
  }
  
  getMetrics() {
    const result = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        count: values.length,
        average: values.reduce((sum, m) => sum + m.value, 0) / values.length,
        min: Math.min(...values.map(m => m.value)),
        max: Math.max(...values.map(m => m.value)),
        latest: values[values.length - 1]?.value
      };
    });
    
    return result;
  }
  
  _monitorWebVitals() {
    // FCP monitoring
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.addMetric('fcp', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'] });
    
    // LCP monitoring
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.addMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
}

// Global framework instance
let globalFramework = null;

/**
 * 🌐 Create framework instance
 */
function createFramework(options = {}) {
  globalFramework = new NativeFramework(options);
  return globalFramework;
}

/**
 * 📊 Get global framework
 */
function getFramework() {
  return globalFramework;
}

/**
 * 🧩 Quick component registration
 */
function defineComponent(name, componentClass, options = {}) {
  if (!globalFramework) {
    globalFramework = createFramework();
  }
  
  return globalFramework.component(name, componentClass, options);
}

export {
  NativeFramework,
  FrameworkPerformanceMonitor,
  createFramework,
  getFramework,
  defineComponent,
  
  // Re-export core classes
  NativeComponent,
  NativeStateStore,
  NativeRouter
};