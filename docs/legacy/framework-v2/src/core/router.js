/**
 * Router - Simple client-side routing
 * Clean, no dependencies
 */

export class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentRoute = null;
    this.outlet = options.outlet || 'router-outlet';
    this.baseUrl = options.baseUrl || '';
    
    // Initialize
    this._init();
  }
  
  _init() {
    // Listen to popstate
    window.addEventListener('popstate', () => this._handleRouteChange());
    
    // Listen to link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this._shouldHandleLink(link)) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
    
    // Initial route
    this._handleRouteChange();
  }
  
  // Add route
  route(path, handler) {
    this.routes.set(this._normalizePath(path), {
      path,
      handler,
      regex: this._pathToRegex(path),
      params: []
    });
    return this;
  }
  
  // Navigate to path
  navigate(path, options = {}) {
    const normalizedPath = this._normalizePath(path);
    
    if (options.replace) {
      window.history.replaceState(null, '', normalizedPath);
    } else {
      window.history.pushState(null, '', normalizedPath);
    }
    
    this._handleRouteChange();
  }
  
  // Handle route change
  async _handleRouteChange() {
    const path = window.location.pathname;
    const route = this._findRoute(path);
    
    if (!route) {
      this._render404();
      return;
    }
    
    // Extract params
    const params = this._extractParams(route, path);
    
    // Update current route
    this.currentRoute = {
      path,
      params,
      query: Object.fromEntries(new URLSearchParams(window.location.search))
    };
    
    // Handle route
    const result = await route.handler(this.currentRoute);
    
    // Render result
    this._render(result);
  }
  
  // Find matching route
  _findRoute(path) {
    for (const [, route] of this.routes) {
      if (route.regex.test(path)) {
        return route;
      }
    }
    return null;
  }
  
  // Convert path to regex
  _pathToRegex(path) {
    const regex = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, (_, key) => {
        this.routes.get(path)?.params.push(key);
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');
    
    return new RegExp(`^${regex}$`);
  }
  
  // Extract params from path
  _extractParams(route, path) {
    const match = route.regex.exec(path);
    const params = {};
    
    if (match) {
      route.params.forEach((key, index) => {
        params[key] = match[index + 1];
      });
    }
    
    return params;
  }
  
  // Render content
  _render(content) {
    const outlet = document.querySelector(this.outlet);
    if (!outlet) {
      console.error(`Router outlet "${this.outlet}" not found`);
      return;
    }
    
    if (typeof content === 'string') {
      outlet.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      outlet.innerHTML = '';
      outlet.appendChild(content);
    } else if (content && typeof content.render === 'function') {
      outlet.innerHTML = '';
      outlet.appendChild(content.render());
    }
  }
  
  // Render 404
  _render404() {
    this._render('<h1>404 - Page not found</h1>');
  }
  
  // Should handle link
  _shouldHandleLink(link) {
    const href = link.getAttribute('href');
    return href && 
           href.startsWith('/') && 
           !link.hasAttribute('data-external') &&
           !link.hasAttribute('download');
  }
  
  // Normalize path
  _normalizePath(path) {
    if (this.baseUrl) {
      path = this.baseUrl + path;
    }
    return path.replace(/\/+/g, '/');
  }
  
  // Go back
  back() {
    window.history.back();
  }
  
  // Go forward
  forward() {
    window.history.forward();
  }
  
  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Global router instance
let globalRouter = null;

export function createRouter(options) {
  globalRouter = new Router(options);
  return globalRouter;
}

export function getRouter() {
  return globalRouter;
}

// Router outlet component
export class RouterOutlet extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('id')) {
      this.id = 'router-outlet';
    }
  }
}

// Define router outlet
if (!customElements.get('router-outlet')) {
  customElements.define('router-outlet', RouterOutlet);
}