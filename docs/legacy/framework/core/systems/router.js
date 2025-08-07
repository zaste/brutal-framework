/**
 * 🛣️ PHASE III - NATIVE ROUTER SYSTEM
 * Client-side routing for Native Web Components
 * 
 * Performance Target: Sub-millisecond route changes
 * Architecture: History API + Custom Events + Component Lazy Loading
 */

import { NativeStateStore } from './state-manager.js';

/**
 * 🎯 NATIVE ROUTER
 * High-performance client-side routing system
 */
class NativeRouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.guards = new Map();
    this.middleware = [];
    this.currentRoute = null;
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    
    // Router state management
    this.state = new NativeStateStore({
      currentPath: window.location.pathname,
      currentQuery: new URLSearchParams(window.location.search),
      currentHash: window.location.hash,
      isNavigating: false,
      navigationError: null
    });
    
    // Performance tracking
    this.performanceMetrics = {
      navigations: [],
      routeLoads: [],
      componentLoads: []
    };
    
    // Configuration
    this.config = {
      baseURL: options.baseURL || '',
      enableHashRouting: options.enableHashRouting || false,
      enableLazyLoading: options.enableLazyLoading !== false,
      scrollBehavior: options.scrollBehavior || 'auto',
      enableTransitions: options.enableTransitions !== false,
      ...options
    };
    
    // Initialize router
    this._initialize();
  }
  
  /**
   * 🔧 Initialize router system
   */
  _initialize() {
    // Listen to browser navigation
    window.addEventListener('popstate', this._handlePopState.bind(this));
    
    // Listen to link clicks
    document.addEventListener('click', this._handleLinkClick.bind(this));
    
    // Initialize current route
    this._updateCurrentRoute();
  }
  
  /**
   * 🛣️ Register route
   */
  route(path, component, options = {}) {
    const route = {
      path: this._normalizePath(path),
      component,
      options: {
        lazy: options.lazy !== false,
        guard: options.guard,
        meta: options.meta || {},
        transition: options.transition,
        cache: options.cache !== false,
        preload: options.preload || false,
        ...options
      },
      pattern: this._createRoutePattern(path),
      keys: []
    };
    
    this.routes.set(path, route);
    
    // Preload if specified
    if (route.options.preload) {
      this._preloadRoute(route);
    }
    
    return this;
  }
  
  /**
   * 🔒 Register route guard
   */
  guard(path, guardFunction) {
    this.guards.set(this._normalizePath(path), guardFunction);
    return this;
  }
  
  /**
   * 🔧 Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }
  
  /**
   * 🧭 Navigate to path
   */
  async navigate(path, options = {}) {
    const startTime = performance.now();
    
    try {
      this.state.setState({ isNavigating: true, navigationError: null });
      
      const normalizedPath = this._normalizePath(path);
      const route = this._findRoute(normalizedPath);
      
      if (!route) {
        throw new Error(`Route not found: ${path}`);
      }
      
      // Run guards
      const guardResult = await this._runGuards(route, normalizedPath);
      if (guardResult !== true) {
        if (typeof guardResult === 'string') {
          return this.navigate(guardResult, options);
        }
        throw new Error('Navigation blocked by guard');
      }
      
      // Run middleware
      await this._runMiddleware(route, normalizedPath);
      
      // Load component
      const component = await this._loadComponent(route);
      
      // Update browser history
      if (!options.replace) {
        window.history.pushState({ path: normalizedPath }, '', normalizedPath);
      } else {
        window.history.replaceState({ path: normalizedPath }, '', normalizedPath);
      }
      
      // Update current route
      this.currentRoute = {
        path: normalizedPath,
        route,
        component,
        params: this._extractParams(route, normalizedPath),
        query: new URLSearchParams(window.location.search),
        hash: window.location.hash
      };
      
      // Add to history
      this._addToHistory(this.currentRoute);
      
      // Update state
      this.state.setState({
        currentPath: normalizedPath,
        currentQuery: this.currentRoute.query,
        currentHash: this.currentRoute.hash,
        isNavigating: false
      });
      
      // Render component
      await this._renderComponent(this.currentRoute);
      
      // Handle scroll behavior
      this._handleScrollBehavior(options.scrollBehavior || this.config.scrollBehavior);
      
      // Emit navigation event
      this._emitNavigationEvent('navigate', this.currentRoute);
      
      // Performance tracking
      const navigationTime = performance.now() - startTime;
      this.performanceMetrics.navigations.push({
        path: normalizedPath,
        time: navigationTime,
        timestamp: Date.now()
      });
      
      return this.currentRoute;
      
    } catch (error) {
      this.state.setState({ 
        isNavigating: false, 
        navigationError: error.message 
      });
      
      this._emitNavigationEvent('navigation-error', { error, path });
      throw error;
    }
  }
  
  /**
   * 🔍 Find matching route
   */
  _findRoute(path) {
    for (const [routePath, route] of this.routes) {
      if (route.pattern.test(path)) {
        return route;
      }
    }
    return null;
  }
  
  /**
   * 📝 Create route pattern
   */
  _createRoutePattern(path) {
    const keys = [];
    
    // Convert path to regex pattern
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:([^/]+)/g, (match, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');
    
    const route = this.routes.get(path);
    if (route) {
      route.keys = keys;
    }
    
    return new RegExp(`^${pattern}$`);
  }
  
  /**
   * 🔍 Extract route parameters
   */
  _extractParams(route, path) {
    const match = route.pattern.exec(path);
    if (!match) return {};
    
    const params = {};
    route.keys.forEach((key, index) => {
      params[key] = match[index + 1];
    });
    
    return params;
  }
  
  /**
   * 🔒 Run route guards
   */
  async _runGuards(route, path) {
    // Route-specific guard
    if (route.options.guard) {
      const result = await route.options.guard(path, this.currentRoute);
      if (result !== true) return result;
    }
    
    // Global guards
    for (const [guardPath, guardFunction] of this.guards) {
      if (path.startsWith(guardPath)) {
        const result = await guardFunction(path, this.currentRoute);
        if (result !== true) return result;
      }
    }
    
    return true;
  }
  
  /**
   * 🔧 Run middleware
   */
  async _runMiddleware(route, path) {
    for (const middleware of this.middleware) {
      await middleware(route, path, this.currentRoute);
    }
  }
  
  /**
   * 📦 Load component
   */
  async _loadComponent(route) {
    const startTime = performance.now();
    
    try {
      let component = route.component;
      
      // Handle lazy loading
      if (route.options.lazy && typeof component === 'function') {
        component = await component();
      }
      
      // Handle ES module default exports
      if (component && component.default) {
        component = component.default;
      }
      
      // Performance tracking
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.componentLoads.push({
        route: route.path,
        time: loadTime,
        timestamp: Date.now()
      });
      
      return component;
      
    } catch (error) {
      console.error(`[NativeRouter] Component load error for ${route.path}:`, error);
      throw error;
    }
  }
  
  /**
   * 🎨 Render component
   */
  async _renderComponent(currentRoute) {
    const startTime = performance.now();
    
    try {
      // Get router outlet
      const outlet = document.querySelector('router-outlet') || 
                    document.querySelector('[data-router-outlet]') ||
                    document.body;
      
      // Handle transitions
      if (this.config.enableTransitions && currentRoute.route.options.transition) {
        await this._handleTransition(outlet, currentRoute);
      } else {
        // Direct rendering
        await this._directRender(outlet, currentRoute);
      }
      
      // Performance tracking
      const renderTime = performance.now() - startTime;
      this.performanceMetrics.routeLoads.push({
        path: currentRoute.path,
        time: renderTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`[NativeRouter] Render error for ${currentRoute.path}:`, error);
      throw error;
    }
  }
  
  /**
   * 🎨 Direct rendering without transitions
   */
  async _directRender(outlet, currentRoute) {
    const { component, params, query, hash } = currentRoute;
    
    // Clear outlet
    outlet.innerHTML = '';
    
    // Create component instance
    let instance;
    
    if (typeof component === 'string') {
      // HTML string
      outlet.innerHTML = component;
    } else if (component.prototype && component.prototype.connectedCallback) {
      // Custom Element class
      const tagName = component.name.toLowerCase().replace(/([A-Z])/g, '-$1');
      instance = document.createElement(tagName);
      
      // Pass route data
      if (instance.setRouteData) {
        instance.setRouteData({ params, query, hash });
      }
      
      outlet.appendChild(instance);
    } else if (typeof component === 'function') {
      // Function component
      const result = component({ params, query, hash });
      if (typeof result === 'string') {
        outlet.innerHTML = result;
      } else if (result instanceof HTMLElement) {
        outlet.appendChild(result);
      }
    }
    
    return instance;
  }
  
  /**
   * 🎭 Handle component transitions
   */
  async _handleTransition(outlet, currentRoute) {
    const transition = currentRoute.route.options.transition;
    
    if (typeof transition === 'function') {
      await transition(outlet, currentRoute);
    } else {
      // Default fade transition
      outlet.style.opacity = '0';
      await this._directRender(outlet, currentRoute);
      outlet.style.transition = 'opacity 0.3s ease';
      outlet.style.opacity = '1';
    }
  }
  
  /**
   * 📜 Add to navigation history
   */
  _addToHistory(route) {
    this.history.push({
      ...route,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
  
  /**
   * 📊 Handle scroll behavior
   */
  _handleScrollBehavior(behavior) {
    switch (behavior) {
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'smooth-top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'preserve':
        // Don't change scroll position
        break;
      default:
        // Auto - scroll to top for new routes, preserve for back/forward
        if (window.history.state && window.history.state.scrollY !== undefined) {
          window.scrollTo(0, window.history.state.scrollY);
        } else {
          window.scrollTo(0, 0);
        }
    }
  }
  
  /**
   * 🔗 Handle link clicks
   */
  _handleLinkClick(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Skip external links and special protocols
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    
    // Skip if router disabled for this link
    if (link.hasAttribute('data-no-router')) {
      return;
    }
    
    event.preventDefault();
    this.navigate(href);
  }
  
  /**
   * ⏪ Handle browser back/forward
   */
  _handlePopState(event) {
    this._updateCurrentRoute();
  }
  
  /**
   * 🔄 Update current route from browser state
   */
  _updateCurrentRoute() {
    const path = window.location.pathname;
    this.navigate(path, { replace: true }).catch(error => {
      console.error('[NativeRouter] Route update error:', error);
    });
  }
  
  /**
   * 📢 Emit navigation events
   */
  _emitNavigationEvent(type, detail) {
    const event = new CustomEvent(`router:${type}`, {
      detail,
      bubbles: true
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * 🔧 Normalize path
   */
  _normalizePath(path) {
    if (this.config.baseURL) {
      path = path.replace(new RegExp(`^${this.config.baseURL}`), '');
    }
    
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  /**
   * ⏮️ Go back
   */
  back() {
    window.history.back();
  }
  
  /**
   * ⏭️ Go forward
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * 📊 Get performance metrics
   */
  getPerformanceMetrics() {
    const avgNavigationTime = this.performanceMetrics.navigations.length > 0
      ? this.performanceMetrics.navigations.reduce((sum, n) => sum + n.time, 0) / this.performanceMetrics.navigations.length
      : 0;
    
    return {
      routeCount: this.routes.size,
      navigationCount: this.performanceMetrics.navigations.length,
      averageNavigationTime: avgNavigationTime,
      historySize: this.history.length,
      performance: this.performanceMetrics
    };
  }
  
  /**
   * 🧹 Cleanup
   */
  destroy() {
    window.removeEventListener('popstate', this._handlePopState.bind(this));
    document.removeEventListener('click', this._handleLinkClick.bind(this));
    this.routes.clear();
    this.guards.clear();
    this.middleware.length = 0;
  }
}

/**
 * 🏷️ ROUTER OUTLET COMPONENT
 * Component for rendering routed content
 */
class RouterOutlet extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('data-router-outlet')) {
      this.setAttribute('data-router-outlet', '');
    }
  }
}

// Register router outlet
if (!customElements.get('router-outlet')) {
  customElements.define('router-outlet', RouterOutlet);
}

// Global router instance
let globalRouter = null;

/**
 * 🌐 Create global router
 */
function createRouter(options = {}) {
  globalRouter = new NativeRouter(options);
  return globalRouter;
}

/**
 * 📊 Get global router
 */
function getRouter() {
  return globalRouter;
}

export {
  NativeRouter,
  RouterOutlet,
  createRouter,
  getRouter
};