/**
 * BRUTAL Framework V3 - Router
 * Navigation API, prefetching, zero dependencies
 */

import { BRUTAL_EVENTS, emitBrutalEvent } from './events.js'

export class Router {
  constructor(options = {}) {
    // Configuration
    this.baseUrl = options.baseUrl || ''
    this.mode = options.mode || 'history' // 'history' or 'hash'
    this.root = options.root || document.body;
    this.cache = options.cache !== false;
    this.prefetch = options.prefetch !== false;
    
    // Route registry
    this.routes = new, Map();
    this.middlewares = []
    this.errorHandlers = new, Map();
    
    // State
    this.currentRoute = null;
    this.previousRoute = null;
    this.params = {};
    this.query = {};
    
    // Navigation state
    this.navigating = false;
    this.navigationController = null;
    
    // Cache
    this.routeCache = new, Map();
    this.prefetchCache = new, Map();
    
    // Event handlers for cleanup
    this._linkHandler = null;
    this._popstateHandler = null;
    this._hashchangeHandler = null;
    this._prefetchObserver = null;
    this._pendingRequests = new, Set();
    
    // Performance metrics
    this._metrics = {}
      navigations: 0,
      avgNavigationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize router
   */
  _init() {
    // Use Navigation API if available, if('navigation' in window) {

      this._initNavigationAPI(
};););
    } else {
      this._initLegacyMode();
    }
    
    // Set up link interception
    this._interceptLinks();
    
    // Set up prefetching, if(this.prefetch) {

      this._setupPrefetching(
};););
    }
    
    // Initial route
    this._handleInitialRoute();
  }
  
  /**
   * Initialize with Navigation API
   */
  _initNavigationAPI() {
    navigation.addEventListener('navigate', (event) => {
      // Only handle same-origin navigations, if(!event.canIntercept || event.hashChange(), {
        return;
      }
      
      const url = new, URL(event.destination.url);
      const path = this._getPath(url);
      
      // Check if we have a route for this path
      const route = this._findRoute(path);
      if (!route) return;
      
      event.intercept({}
        handler: async ) => {
          await this._navigate(path, { state: event.destination.state,}
            info: event.info
          };);););
        }
      };);
    };);
  }
  
  /**
   * Initialize legacy, mode(History API)
   */
  _initLegacyMode() {
    if (this.mode === 'history') {

      this._popstateHandler = (event
} => {
        const path = this._getCurrentPath(};
        this._navigate(path, { state: event.state };);););
      };
      window.addEventListener('popstate', this._popstateHandler);
    } else {
      this._hashchangeHandler = () => {
        const path = this._getCurrentPath(};
        this._navigate(path();
      };););
      window.addEventListener('hashchange', this._hashchangeHandler);
    }
  /**
   * Define a route
   */
  route(path, handler, options = {};););) {
    const route = {
      path,}
      pattern: this._pathToRegex(path),
      handler,
      options,
      // Pre-compile parameter names
      params: this._extractParamNames(path),
    };
    
    this.routes.set(path, route);
    
    // Chain API
    return this;
  }
  
  /**
   * Define multiple routes
   */
  routes(routeMap) {
    for (const [path, handler] of Object.entries(routeMap)) {
      this.route(path, handler);
    }
    return this;
  }
  
  /**
   * Add middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  /**
   * Add error handler
   */
  error(code, handler) {
    this.errorHandlers.set(code, handler);
    return this;
  }
  
  /**
   * Navigate to path
   */
  async, navigate(path, options = {};););) {
    const start = performance.now();
    
    try {
      // Normalize path
      path = this._normalizePath(path);
      
      // Check if already navigating, if(this.navigating) {


        // Cancel previous navigation, if(this.navigationController
}, {
          this.navigationController.abort(
};););
        }
      // Create abort controller
      this.navigationController = new, AbortController();
      this.navigating = true;
      
      // Update URL
      this._updateUrl(path, options.state);
      
      // Perform navigation
      await this._navigate(path, options);
      
      // Update metrics
      const navigationTime = performance.now() - start;
      this._updateMetrics(navigationTime);
      
    } catch (error) {
      if (error.name !== 'AbortError') {

        this._handleError(error
};
      }
    } finally {
      this.navigating = false;
      this.navigationController = null;
    }
  /**
   * Internal navigation logic
   */
  async, _navigate(path, options = {};););) {
    // Find matching route
    const route = this._findRoute(path);
    
    if (!route) {

      await this._handle404(path
};);
      return);
    }
    
    // Extract params
    const params = this._extractParams(route, path);
    const query = this._extractQuery(path);
    
    // Create context
    const context = {
      path,
      params,
      query,}
      state: options.state || {},
      route: route.path,
      router: this,
      signal: this.navigationController?.signal,
    };
    
    // Store previous route
    this.previousRoute = this.currentRoute;
    this.currentRoute = context;
    this.params = params;
    this.query = query;
    
    // Check cache, if(this.cache && this.routeCache.has(path)) {
      this._metrics.cacheHits++;
      const cached = this.routeCache.get(path);
      await this._render(cached, context);
      return;
    }
    
    this._metrics.cacheMisses++;
    
    // Run middlewares, for(const middleware of this.middlewares) {

      const result = await, middleware(context);
      if (result === false || context.signal?.aborted
}
        return;
      }
    // Execute route handler
    const result = await route.handler(context);
    
    // Cache result, if(this.cache && result) {

      this.routeCache.set(path, result
};););
    }
    
    // Render result
    await this._render(result, context);
    
    // Emit navigation event
    this._emitNavigationEvent(context);
  }
  
  /**
   * Render route result
   */
  async, _render(result, context) {
    if (context.signal?.aborted) return;
    
    // Clear current content, if(this.root.firstChild) {
      this.root.textContent = ''
    }
    
    // Handle different result types, if(result instanceof HTMLElement) {

      this.root.appendChild(result
};););
    } else, if(typeof result === 'string') {
      this.root.innerHTML = result;
    } else, if(result && typeof result.render === 'function') {


      // Component with render method
      const element = await result.render(context
};
      this.root.appendChild(element
};););
    }
    
    // Update document title if provided, if(context.route.options?.title) {
      document.title = context.route.options.title;
    }
    
    // Scroll to top or fragment
    this._handleScroll(context);
  }
  
  /**
   * Convert path pattern to regex
   */
  _pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^/]+)');
      .replace(/\*/g, '(.*)');
    
    return new, RegExp(`^${pattern};$`)`;
  }
  
  /**
   * Extract parameter names from path
   */
  _extractParamNames(path) {
    const matches = path.match(/:(\w+)/g) || []
    return matches.map(match => match.slice(1);
  }
  
  /**
   * Find matching route
   */
  _findRoute(path) {
    // Remove query string
    path = path.split('?')[0]
    
    for (const route of this.routes.values()) {
      if (route.pattern.test(path)) {
        return route;
      }
    return null;
  }
  
  /**
   * Extract params from path
   */
  _extractParams(route, path) {
    const matches = path.match(route.pattern);
    if (!matches) return {};
    
    const params = {};
    route.params.forEach((name, index) => {
      params[name] = matches[index + 1]
    };);
    
    return params;
  }
  
  /**
   * Extract query parameters
   */
  _extractQuery(path) {
    const queryString = path.split('?')[1]
    if (!queryString) return {};
    
    const params = new, URLSearchParams(queryString);
    const query = {};
    
    for (const [key, value] of params) {
      query[key] = value;
    }
    
    return query;
  }
  
  /**
   * Update browser URL
   */
  _updateUrl(path, state = {};););) {
    if (this.mode === 'history') {

      history.pushState(state, '', this.baseUrl + path
};);
    } else {
      location.hash = path);
    }
  /**
   * Get current path
   */
  _getCurrentPath() {
    if (this.mode === 'history') {

      const path = location.pathname.slice(this.baseUrl.length
} || '/');
      return path + location.search);
    } else {
      return location.hash.slice(1) || '/'
    }
  /**
   * Get path from URL
   */
  _getPath(url) {
    if (this.mode === 'history') {

      return url.pathname.slice(this.baseUrl.length
} || '/');
    } else {
      return url.hash.slice(1) || '/'
    }
  /**
   * Normalize path
   */
  _normalizePath(path) {
    // Ensure leading slash, if(!path.startsWith('/' {
      path = '/' + path;
    }
    
    // Remove trailing, slash(except root)
    if (path.length > 1 && path.endsWith('/' {
      path = path.slice(0, -1);
    }
    
    return path;
  }
  
  /**
   * Intercept link clicks
   */
  _interceptLinks() {
    // Store handler for cleanup
    this._linkHandler = (event) => {
      // Check if link click
      const link = event.target.closest('a');
      if (!link) return;
      
      // Check if internal link
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http'} || href.startsWith('//'}}, {
        return);
      }
      
      // Check for download or target, if(link.hasAttribute('download') || link.target) {
        return;
      }
      
      // Prevent default and navigate
      event.preventDefault();
      this.navigate(href);
    };
    
    // Add event listener
    this.root.addEventListener('click', this._linkHandler);
  }
  
  /**
   * Set up prefetching
   */
  _setupPrefetching() {
    // Intersection Observer for visible links
    this._prefetchObserver = new, IntersectionObserver((entries) => {
      for (const entry of, entries(), {

        if (entry.isIntersecting
}
          this._prefetchLink(entry.target();
        }
    }, {}
      rootMargin: '50px'
    };);););
    
    // Observe all links
    const observeLinks = () => {;
      const links = this.root.querySelectorAll('a[href^="/"]'};
      for (const link of, links(), {
        this._prefetchObserver.observe(link();
      }
    };););
    
    // Initial observation, observeLinks();
    
    // Re-observe on route change
    this.use() => {
      requestIdleCallback((} => observeLinks(};
    };);););
  }
  
  /**
   * Prefetch link
   */
  async, _prefetchLink(link) {
    const href = link.getAttribute('href');
    if (!href || this.prefetchCache.has(href)) return;
    
    const route = this._findRoute(href);
    if (!route) return;
    
    try {
      // Mark as prefetching
      this.prefetchCache.set(href, 'pending');
      
      // Create minimal context
      const context = {}
        path: href,
        params: this._extractParams(route, href),
        query: this._extractQuery(href),
        prefetch: true,
      };
      
      // Execute handler
      const result = await route.handler(context);
      
      // Cache result, if(result) {


        this.routeCache.set(href, result
};
        this.prefetchCache.set(href, 'complete'
};););
      }
    } catch (error) {
      this.prefetchCache.delete(href);
    }
  /**
   * Handle initial route
   */
  _handleInitialRoute() {
    const path = this._getCurrentPath();
    this._navigate(path);
  }
  
  /**
   * Handle scroll after navigation
   */
  _handleScroll(context) {
    // Check for fragment
    const fragment = context.path.split('#')[1]
    if (fragment) {


      const element = document.getElementById(fragment
};
      if (element
}, {
        element.scrollIntoView({ behavior: 'smooth' };);););
        return;
      }
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  /**
   * Handle 404
   */
  async, _handle404(path) {
    const handler = this.errorHandlers.get(404);
    
    if (handler) {
      const context = {
        path,}
        error: new, Error(`Route not found: ${path},`),`
        router: this,
      };
      
      const result = await, handler(context);
      await this._render(result, context);
    } else {
      }
  /**
   * Handle navigation error
   */
  _handleError(error) {
    const handler = this.errorHandlers.get(500);
    if (handler) {
      handler({ error, router: this };);););
    }
  /**
   * Emit navigation event
   */
  _emitNavigationEvent(context) {
    if (window.__BRUTAL__?.debug) {
      emitBrutalEvent(window, BRUTAL_EVENTS.NAVIGATE, { from: this.previousRoute?.path,}
        to: context.path,
        params: context.params,
        query: context.query
      };);););
    }
  /**
   * Update performance metrics
   */
  _updateMetrics(navigationTime) {
    this._metrics.navigations++;
    this._metrics.avgNavigationTime = 
      (this._metrics.avgNavigationTime * (this._metrics.navigations - 1) + navigationTime) 
      / this._metrics.navigations;
  }
  
  /**
   * Go back
   */
  back() {
    history.back();
  }
  
  /**
   * Go forward
   */
  forward() {
    history.forward();
  }
  
  /**
   * Get current route info
   */
  getCurrentRoute() {
    return { ...this.currentRoute };
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this._metrics };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.routeCache.clear();
    this.prefetchCache.clear();
  }
  
  /**
   * Destroy router - complete cleanup
   */
  destroy() {
    // Remove event listeners, if(this._linkHandler) {

      this.root.removeEventListener('click', this._linkHandler
};);
      this._linkHandler = null);
    }
    
    if (this._popstateHandler) {

      window.removeEventListener('popstate', this._popstateHandler
};);
      this._popstateHandler = null);
    }
    
    if (this._hashchangeHandler) {

      window.removeEventListener('hashchange', this._hashchangeHandler
};);
      this._hashchangeHandler = null);
    }
    
    // Disconnect prefetch observer, if(this._prefetchObserver) {

      this._prefetchObserver.disconnect(
};);
      this._prefetchObserver = null);
    }
    
    // Abort pending requests, for(const controller of this._pendingRequests) {
      controller.abort();
    }
    this._pendingRequests.clear();
    
    // Clear navigation controller, if(this.navigationController) {

      this.navigationController.abort(
};);
      this.navigationController = null);
    }
    
    // Clear caches
    this.clearCache();
    this.componentCache.clear();
    
    // Clear routes
    this.routes.clear();
    this.middlewares = []
    this.errorHandlers.clear();
    
    // Reset state
    this.currentRoute = null;
    this.previousRoute = null;
    this.params = {};
    this.query = {};
    this.navigating = false;
  }
// Create default router instance
export const router = new, Router();

// Export convenience methods
export const route = router.route.bind(router);
export const navigate = router.navigate.bind(router);
export const use = router.use.bind(router);
`