/**
 * BRUTAL V4 - Native Routing System
 * Pure Navigation API with zero dependencies
 * History management, lazy loading, and component integration
 */

/**
 * BrutalRouter - Native navigation management
 * Built on Navigation API with History API fallback
 * Supports component lazy loading and route guards
 */
export class BrutalRouter extends EventTarget {
    static instance = null;
    static routes = new Map();
    static currentRoute = null;
    static history = [];
    static guards = new Set();
    
    constructor() {
        super();
        if (BrutalRouter.instance) {
            return BrutalRouter.instance;
        }
        
        this.isNavigating = false;
        this.baseURL = '';
        this.mode = 'history'; // 'history' or 'hash'
        
        BrutalRouter.instance = this;
        this.init();
    }
    
    /**
     * Initialize router
     */
    init() {
        // Use Navigation API if available, fallback to History API
        if ('navigation' in window) {
            this.setupNavigationAPI();
        } else {
            this.setupHistoryAPI();
        }
        
        // Handle initial route
        this.handleCurrentRoute();
    }
    
    /**
     * Setup Navigation API (modern browsers)
     */
    setupNavigationAPI() {
        window.navigation.addEventListener('navigate', (event) => {
            if (this.shouldIntercept(event)) {
                event.intercept({
                    handler: () => this.handleNavigation(event.destination.url)
                });
            }
        });
    }
    
    /**
     * Setup History API fallback
     */
    setupHistoryAPI() {
        window.addEventListener('popstate', (event) => {
            this.handleNavigation(window.location.pathname);
        });
        
        // Intercept link clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (link && this.shouldInterceptLink(link)) {
                event.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    }
    
    /**
     * Define a route
     */
    static define(path, handler, options = {}) {
        const route = {
            path: this.normalizePath(path),
            handler,
            options: {
                exact: options.exact !== false,
                lazy: options.lazy || false,
                guards: options.guards || [],
                meta: options.meta || {},
                ...options
            },
            params: this.extractParams(path),
            regex: this.pathToRegex(path)
        };
        
        this.routes.set(path, route);
        
        // Handle lazy loading
        if (route.options.lazy && typeof handler === 'function') {
            route.loader = handler;
            route.handler = null; // Will be loaded on demand
        }
        
        return route;
    }
    
    /**
     * Navigate to path
     */
    static async navigate(path, options = {}) {
        if (this.instance.isNavigating) {
            return false;
        }
        
        const normalizedPath = this.normalizePath(path);
        
        // Check route guards
        if (!await this.checkGuards(normalizedPath, options)) {
            return false;
        }
        
        this.instance.isNavigating = true;
        
        try {
            // Update browser history
            if (options.replace) {
                history.replaceState({ path: normalizedPath }, '', normalizedPath);
            } else {
                history.pushState({ path: normalizedPath }, '', normalizedPath);
            }
            
            // Handle navigation
            await this.instance.handleNavigation(normalizedPath, options);
            
            return true;
        } catch (error) {
            console.error('[BrutalRouter] Navigation failed:', error);
            this.instance.emit('navigation-error', { path: normalizedPath, error });
            return false;
        } finally {
            this.instance.isNavigating = false;
        }
    }
    
    /**
     * Handle navigation to path
     */
    async handleNavigation(path, options = {}) {
        const route = this.constructor.findRoute(path);
        
        if (!route) {
            await this.handleNotFound(path);
            return;
        }
        
        // Load route handler if lazy
        if (route.options.lazy && !route.handler) {
            try {
                route.handler = await route.loader();
            } catch (error) {
                console.error('[BrutalRouter] Failed to load route:', error);
                await this.handleError(path, error);
                return;
            }
        }
        
        // Extract route parameters
        const params = this.constructor.extractRouteParams(route, path);
        
        // Update current route
        const previousRoute = this.constructor.currentRoute;
        this.constructor.currentRoute = {
            path,
            route,
            params,
            query: this.constructor.parseQuery(),
            meta: route.options.meta
        };
        
        // Add to history
        this.constructor.history.push(this.constructor.currentRoute);
        
        // Execute route handler
        try {
            await this.executeRouteHandler(route, this.constructor.currentRoute, previousRoute);
            
            // Emit navigation event
            this.emit('navigation-complete', {
                current: this.constructor.currentRoute,
                previous: previousRoute
            });
            
        } catch (error) {
            console.error('[BrutalRouter] Route handler failed:', error);
            await this.handleError(path, error);
        }
    }
    
    /**
     * Execute route handler
     */
    async executeRouteHandler(route, currentRoute, previousRoute) {
        if (typeof route.handler === 'function') {
            return route.handler(currentRoute, previousRoute);
        }
        
        if (typeof route.handler === 'string') {
            // Component name - create and render
            const element = document.createElement(route.handler);
            const outlet = this.getRouterOutlet();
            
            if (outlet) {
                // Clear previous content
                outlet.innerHTML = '';
                outlet.appendChild(element);
                
                // Pass route data to component
                if (element.setRouteData) {
                    element.setRouteData(currentRoute);
                }
            }
            
            return element;
        }
        
        if (route.handler && typeof route.handler === 'object') {
            // Component class
            const element = new route.handler();
            const outlet = this.getRouterOutlet();
            
            if (outlet) {
                outlet.innerHTML = '';
                outlet.appendChild(element);
                
                if (element.setRouteData) {
                    element.setRouteData(currentRoute);
                }
            }
            
            return element;
        }
    }
    
    /**
     * Find route for path
     */
    static findRoute(path) {
        const normalizedPath = this.normalizePath(path);
        
        // Try exact match first
        if (this.routes.has(normalizedPath)) {
            return this.routes.get(normalizedPath);
        }
        
        // Try pattern matching
        for (const [routePath, route] of this.routes) {
            if (route.regex.test(normalizedPath)) {
                return route;
            }
        }
        
        return null;
    }
    
    /**
     * Extract route parameters
     */
    static extractRouteParams(route, path) {
        const match = route.regex.exec(this.normalizePath(path));
        const params = {};
        
        if (match && route.params.length > 0) {
            route.params.forEach((param, index) => {
                params[param] = match[index + 1];
            });
        }
        
        return params;
    }
    
    /**
     * Convert path pattern to regex
     */
    static pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, '([^\/]+)')
            .replace(/\*/g, '.*');
        
        return new RegExp(`^${pattern}$`);
    }
    
    /**
     * Extract parameter names from path
     */
    static extractParams(path) {
        const params = [];
        const matches = path.matchAll(/:([^\/]+)/g);
        
        for (const match of matches) {
            params.push(match[1]);
        }
        
        return params;
    }
    
    /**
     * Normalize path
     */
    static normalizePath(path) {
        if (!path || path === '/') return '/';
        
        // Remove query string and hash
        path = path.split('?')[0].split('#')[0];
        
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Remove trailing slash except for root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return path;
    }
    
    /**
     * Parse query string
     */
    static parseQuery(queryString = window.location.search) {
        const params = new URLSearchParams(queryString);
        const query = {};
        
        for (const [key, value] of params) {
            query[key] = value;
        }
        
        return query;
    }
    
    /**
     * Add route guard
     */
    static addGuard(guard) {
        this.guards.add(guard);
    }
    
    /**
     * Remove route guard
     */
    static removeGuard(guard) {
        this.guards.delete(guard);
    }
    
    /**
     * Check route guards
     */
    static async checkGuards(path, options) {
        for (const guard of this.guards) {
            try {
                const result = await guard(path, this.currentRoute, options);
                if (result === false) {
                    return false;
                }
            } catch (error) {
                console.error('[BrutalRouter] Guard error:', error);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Get router outlet element
     */
    getRouterOutlet() {
        return document.querySelector('router-outlet') || 
               document.querySelector('[data-router-outlet]') ||
               document.getElementById('router-outlet') ||
               document.body;
    }
    
    /**
     * Handle current route on init
     */
    handleCurrentRoute() {
        const currentPath = window.location.pathname;
        this.handleNavigation(currentPath);
    }
    
    /**
     * Handle 404 not found
     */
    async handleNotFound(path) {
        const notFoundRoute = this.constructor.routes.get('*') || 
                            this.constructor.routes.get('/404');
        
        if (notFoundRoute) {
            await this.executeRouteHandler(notFoundRoute, {
                path,
                route: notFoundRoute,
                params: { path },
                query: this.constructor.parseQuery(),
                meta: { notFound: true }
            });
        } else {
            // Default 404 handling
            const outlet = this.getRouterOutlet();
            if (outlet) {
                outlet.innerHTML = `<h1>404 - Page Not Found</h1><p>Path: ${path}</p>`;
            }
        }
        
        this.emit('not-found', { path });
    }
    
    /**
     * Handle routing error
     */
    async handleError(path, error) {
        const errorRoute = this.constructor.routes.get('/error');
        
        if (errorRoute) {
            await this.executeRouteHandler(errorRoute, {
                path,
                route: errorRoute,
                params: { error: error.message },
                query: this.constructor.parseQuery(),
                meta: { error: true }
            });
        } else {
            // Default error handling
            const outlet = this.getRouterOutlet();
            if (outlet) {
                outlet.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
            }
        }
        
        this.emit('navigation-error', { path, error });
    }
    
    /**
     * Check if navigation should be intercepted
     */
    shouldIntercept(event) {
        return event.canIntercept && 
               event.navigationType === 'push' &&
               !event.downloadRequest &&
               !event.formData;
    }
    
    /**
     * Check if link should be intercepted
     */
    shouldInterceptLink(link) {
        const href = link.getAttribute('href');
        
        // Skip external links
        if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
            return false;
        }
        
        // Skip mailto, tel, etc.
        if (href.includes(':') && !href.startsWith('/')) {
            return false;
        }
        
        // Skip download links
        if (link.hasAttribute('download')) {
            return false;
        }
        
        // Skip target="_blank"
        if (link.getAttribute('target') === '_blank') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get current route
     */
    static getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get route history
     */
    static getHistory() {
        return [...this.history];
    }
    
    /**
     * Go back in history
     */
    static back() {
        history.back();
    }
    
    /**
     * Go forward in history
     */
    static forward() {
        history.forward();
    }
    
    /**
     * Replace current route
     */
    static replace(path, options = {}) {
        return this.navigate(path, { ...options, replace: true });
    }
    
    /**
     * Emit router event
     */
    emit(type, detail) {
        const event = new CustomEvent(`brutal:router:${type}`, {
            detail,
            bubbles: true,
            composed: true
        });
        
        window.dispatchEvent(event);
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }
}

/**
 * Router utilities
 */
export const RouterUtils = {
    /**
     * Create route link
     */
    createLink(path, text, options = {}) {
        const link = document.createElement('a');
        link.href = path;
        link.textContent = text;
        
        if (options.class) {
            link.className = options.class;
        }
        
        return link;
    },
    
    /**
     * Check if path matches current route
     */
    isActive(path) {
        const current = BrutalRouter.getCurrentRoute();
        return current && current.path === BrutalRouter.normalizePath(path);
    },
    
    /**
     * Generate URL with query parameters
     */
    buildURL(path, query = {}) {
        const url = new URL(path, window.location.origin);
        
        Object.entries(query).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        
        return url.pathname + url.search;
    }
};

/**
 * Router outlet component
 */
export class RouterOutlet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
            </style>
            <slot></slot>
        `;
    }
}

// Register router outlet
if (!customElements.get('router-outlet')) {
    customElements.define('router-outlet', RouterOutlet);
}

// Initialize router instance
export const router = new BrutalRouter();