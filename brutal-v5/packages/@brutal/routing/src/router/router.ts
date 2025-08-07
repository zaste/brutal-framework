/**
 * Router implementation
 */

import { Route } from '../route/route.js';
import type { RouteConfig, RouteParams } from '../types.js';

export class Router {
  private routes: Route[] = [];
  private _currentRoute: Route | null = null;
  
  get currentRoute(): Route | null {
    return this._currentRoute;
  }
  private container: HTMLElement | null = null;
  
  constructor() {
    // Listen to browser navigation
    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });
    
    // Handle clicks on links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        this.navigate(link.pathname + link.search + link.hash);
      }
    });
  }
  
  /**
   * Add a route
   */
  addRoute(config: RouteConfig): this {
    this.routes.push(new Route(config));
    return this;
  }
  
  /**
   * Add multiple routes
   */
  addRoutes(configs: RouteConfig[]): this {
    configs.forEach(config => this.addRoute(config));
    return this;
  }
  
  /**
   * Set the container element for route rendering
   */
  setContainer(element: HTMLElement): this {
    this.container = element;
    return this;
  }
  
  /**
   * Navigate to a URL
   */
  navigate(url: string): void {
    if (url !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.pushState(null, '', url);
    }
    this.handleNavigation();
  }
  
  /**
   * Start the router
   */
  start(): void {
    this.handleNavigation();
  }
  
  /**
   * Handle navigation
   */
  private async handleNavigation(): Promise<void> {
    const url = window.location.pathname + window.location.search + window.location.hash;
    const route = this.findRoute(url);
    
    if (!route) {
      this.render404();
      return;
    }
    
    const params = this.extractParams(url, route);
    
    // Check beforeEnter guard
    if (route.config.beforeEnter) {
      const canEnter = await route.config.beforeEnter(params);
      if (!canEnter) {
        return;
      }
    }
    
    // Update title
    if (route.config.title) {
      document.title = route.config.title;
    }
    
    // Render component
    this._currentRoute = route;
    this.render(route, params);
  }
  
  /**
   * Find matching route
   */
  private findRoute(url: string): Route | null {
    // Extract just the pathname, removing query and hash
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');
    
    let pathname: string;
    if (queryIndex !== -1 && hashIndex !== -1) {
      pathname = url.substring(0, Math.min(queryIndex, hashIndex));
    } else if (queryIndex !== -1) {
      pathname = url.substring(0, queryIndex);
    } else if (hashIndex !== -1) {
      pathname = url.substring(0, hashIndex);
    } else {
      pathname = url;
    }
    
    for (const route of this.routes) {
      if (pathname && route.matches(pathname)) {
        return route;
      }
    }
    
    return null;
  }
  
  /**
   * Extract params from URL
   */
  private extractParams(url: string, route: Route): RouteParams {
    // Parse URL components properly
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    
    let pathname: string;
    let search = '';
    let hash = '';
    
    if (hashIndex !== -1 && queryIndex !== -1) {
      // Both query and hash present
      if (queryIndex < hashIndex) {
        // ?query#hash
        pathname = url.substring(0, queryIndex);
        search = url.substring(queryIndex + 1, hashIndex);
        hash = url.substring(hashIndex + 1);
      } else {
        // #hash?query (unusual but possible)
        pathname = url.substring(0, hashIndex);
        hash = url.substring(hashIndex + 1);
      }
    } else if (queryIndex !== -1) {
      // Only query present
      pathname = url.substring(0, queryIndex);
      search = url.substring(queryIndex + 1);
    } else if (hashIndex !== -1) {
      // Only hash present
      pathname = url.substring(0, hashIndex);
      hash = url.substring(hashIndex + 1);
    } else {
      // No query or hash
      pathname = url;
    }
    
    // Path params
    const params = pathname ? route.extractParams(pathname) : {};
    
    // Query params
    const query: Record<string, string> = {};
    if (search) {
      const searchParams = new URLSearchParams(search);
      searchParams.forEach((value, key) => {
        query[key] = value;
      });
    }
    
    return { params, query, hash };
  }
  
  /**
   * Render route component
   */
  private render(route: Route, _params: RouteParams): void {
    if (!this.container) {
      console.error('[Router] No container element set');
      return;
    }
    
    if (!route.config.component) {
      this.container.innerHTML = '';
      return;
    }
    
    const result = route.config.component();
    
    if (typeof result === 'string') {
      this.container.innerHTML = result;
    } else if (result instanceof HTMLElement) {
      this.container.innerHTML = '';
      this.container.appendChild(result);
    }
  }
  
  /**
   * Render 404 page
   */
  private render404(): void {
    if (this.container) {
      this.container.innerHTML = '<h1>404 - Page not found</h1>';
    }
    document.title = '404 - Not Found';
  }
}