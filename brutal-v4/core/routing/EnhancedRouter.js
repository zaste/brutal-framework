/**
 * BRUTAL V4 - Enhanced Router
 * Router with Registry integration and improved features
 * Builds on existing Router.js with better component loading
 */

import { BrutalRouter } from './Router.js';
import { Registry } from '../base/Registry.js';
import { CacheManager } from '../cache/CacheManager.js';
import { globalEventBus } from '../events/EventBus.js';

// Route metadata storage
const routeMetadata = new WeakMap();
const routeCache = new Map();

export class EnhancedBrutalRouter extends BrutalRouter {
    constructor() {
        super();
        
        // Enhanced features
        this.lazyLoadQueue = new Map();
        this.routeTransitions = new Map();
        this.middlewares = [];
        
        // Cache manager for routes
        this.cache = new CacheManager({
            name: 'brutal-router',
            maxSize: 50,
            ttl: 300000 // 5 minutes
        });
    }

    /**
     * Enhanced route registration with Registry
     */
    static route(path, options = {}) {
        if (typeof options === 'string') {
            // Legacy: component tag name
            options = { component: options };
        }

        const route = {
            path,
            pattern: this.createPattern(path),
            component: options.component,
            lazy: options.lazy || false,
            guards: options.guards || [],
            meta: options.meta || {},
            cache: options.cache !== false,
            transition: options.transition || 'fade',
            middlewares: options.middlewares || []
        };

        // Store metadata
        routeMetadata.set(route, {
            registeredAt: Date.now(),
            hitCount: 0,
            lastAccessed: null
        });

        this.routes.set(path, route);

        // If component is string, ensure it's registered
        if (typeof route.component === 'string' && !route.lazy) {
            this._ensureComponentRegistered(route.component);
        }

        // Emit route registration event
        globalEventBus.emit('router:route-registered', { path, route });

        return this;
    }

    /**
     * Ensure component is registered with Registry
     */
    static _ensureComponentRegistered(componentName) {
        if (!Registry.has(componentName)) {
            console.warn(`Component '${componentName}' not found in Registry`);
            
            // Try to lazy-define if possible
            Registry.whenDefined(componentName).then(() => {
                console.log(`Component '${componentName}' now available`);
            });
        }
    }

    /**
     * Enhanced navigation with caching
     */
    async navigate(path, options = {}) {
        const startTime = performance.now();
        
        try {
            // Check cache first
            if (!options.force && this.cache.has(path)) {
                const cached = this.cache.get(path);
                if (cached) {
                    return this._renderCached(cached);
                }
            }

            // Run global middlewares
            for (const middleware of this.middlewares) {
                const result = await middleware(path, options);
                if (result === false) {
                    console.log('Navigation cancelled by middleware');
                    return false;
                }
            }

            // Proceed with navigation
            const result = await super.navigate(path, options);

            // Cache successful navigation
            if (result && this.currentRoute?.cache) {
                this.cache.set(path, {
                    route: this.currentRoute,
                    timestamp: Date.now()
                });
            }

            // Update metrics
            const metadata = routeMetadata.get(this.currentRoute);
            if (metadata) {
                metadata.hitCount++;
                metadata.lastAccessed = Date.now();
            }

            // Emit navigation complete
            globalEventBus.emit('router:navigation-complete', {
                path,
                route: this.currentRoute,
                duration: performance.now() - startTime
            });

            return result;

        } catch (error) {
            globalEventBus.emit('router:navigation-error', { path, error });
            throw error;
        }
    }

    /**
     * Load route component with Registry
     */
    async loadRouteComponent(route) {
        const { component, lazy } = route;

        if (!component) {
            throw new Error('Route has no component defined');
        }

        // If component is already a class
        if (typeof component === 'function') {
            return component;
        }

        // If component is a tag name
        if (typeof component === 'string') {
            // Check Registry first
            const ComponentClass = Registry.get(component);
            if (ComponentClass) {
                return ComponentClass;
            }

            // If lazy, try to load
            if (lazy) {
                return await this._lazyLoadComponent(component, route);
            }

            // Wait for registration
            return await Registry.whenDefined(component);
        }

        // If component is a lazy function
        if (typeof component === 'function' && lazy) {
            const module = await component();
            const ComponentClass = module.default || module[Object.keys(module)[0]];
            
            // Register with Registry
            if (route.meta.tagName) {
                Registry.register(route.meta.tagName, ComponentClass);
            }

            return ComponentClass;
        }

        throw new Error('Invalid component configuration');
    }

    /**
     * Lazy load component
     */
    async _lazyLoadComponent(componentName, route) {
        // Check if already loading
        if (this.lazyLoadQueue.has(componentName)) {
            return await this.lazyLoadQueue.get(componentName);
        }

        // Create loading promise
        const loadPromise = (async () => {
            try {
                // Try to import based on naming convention
                const modulePath = route.meta.modulePath || 
                    `/components/${componentName}.js`;
                
                const module = await import(modulePath);
                const ComponentClass = module.default || module[componentName];

                // Register with Registry
                Registry.register(componentName, ComponentClass);
                Registry.define(componentName);

                return ComponentClass;

            } catch (error) {
                console.error(`Failed to lazy load ${componentName}:`, error);
                throw error;
            } finally {
                this.lazyLoadQueue.delete(componentName);
            }
        })();

        this.lazyLoadQueue.set(componentName, loadPromise);
        return await loadPromise;
    }

    /**
     * Add route middleware
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Enhanced route guards with async support
     */
    static guard(guardFn, options = {}) {
        const guard = {
            fn: guardFn,
            name: options.name || guardFn.name || 'anonymous',
            priority: options.priority || 0
        };

        this.guards.add(guard);

        // Sort guards by priority
        this.guards = new Set(
            Array.from(this.guards).sort((a, b) => b.priority - a.priority)
        );

        return this;
    }

    /**
     * Get route statistics
     */
    getStats() {
        const stats = {
            totalRoutes: this.routes.size,
            cacheSize: this.cache.size,
            routes: []
        };

        for (const [path, route] of this.routes) {
            const metadata = routeMetadata.get(route);
            stats.routes.push({
                path,
                component: route.component,
                hitCount: metadata?.hitCount || 0,
                lastAccessed: metadata?.lastAccessed,
                cached: this.cache.has(path)
            });
        }

        return stats;
    }

    /**
     * Clear route cache
     */
    clearCache(path) {
        if (path) {
            this.cache.delete(path);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Route transition handler
     */
    async transitionTo(fromRoute, toRoute) {
        const transition = toRoute.transition || 'fade';
        const outlet = this.getOutlet();

        if (!outlet) return;

        // Emit transition start
        globalEventBus.emit('router:transition-start', {
            from: fromRoute,
            to: toRoute,
            transition
        });

        // Apply transition
        outlet.classList.add(`route-transition-${transition}`);

        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 300));

        // Remove transition class
        outlet.classList.remove(`route-transition-${transition}`);

        // Emit transition end
        globalEventBus.emit('router:transition-end', {
            from: fromRoute,
            to: toRoute
        });
    }
}

// Create enhanced router instance
export const router = new EnhancedBrutalRouter();

// Export convenience methods
export const route = router.route.bind(router);
export const navigate = router.navigate.bind(router);
export const back = router.back.bind(router);
export const forward = router.forward.bind(router);