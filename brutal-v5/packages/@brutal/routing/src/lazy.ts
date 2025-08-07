/**
 * Lazy loading support for routes
 */

import { Route } from './types';

// Cache for loaded components
const componentCache = new Map<Route, any>();
const loadingCache = new Map<Route, Promise<any>>();

/**
 * Load a lazy route component
 */
export async function loadRouteComponent(route: Route): Promise<any> {
  // Return cached component if available
  if (componentCache.has(route)) {
    return componentCache.get(route);
  }
  
  // Return component if not lazy
  if (!route.lazy) {
    return route.component;
  }
  
  // Check if already loading
  if (loadingCache.has(route)) {
    return loadingCache.get(route);
  }
  
  // Start loading
  const loadPromise = route.lazy()
    .then(module => {
      // Extract component from module
      const component = module.default || module;
      
      // Cache the component
      componentCache.set(route, component);
      loadingCache.delete(route);
      
      // Update route with loaded component
      route.component = component;
      
      return component;
    })
    .catch(error => {
      // Clear loading state
      loadingCache.delete(route);
      
      // Re-throw error
      throw error;
    });
  
  // Cache the loading promise
  loadingCache.set(route, loadPromise);
  
  return loadPromise;
}

/**
 * Preload a route component
 */
export function preloadRoute(route: Route): Promise<any> | undefined {
  if (!route.lazy || componentCache.has(route)) {
    return Promise.resolve(route.component);
  }
  
  return loadRouteComponent(route);
}

/**
 * Clear lazy loading caches
 */
export function clearLazyCache(): void {
  componentCache.clear();
  loadingCache.clear();
}

/**
 * Get loading component for a route
 */
export function getLoadingComponent(route: Route): any {
  return route.loading || null;
}

/**
 * Get error component for a route
 */
export function getErrorComponent(route: Route): any {
  return route.error || null;
}

/**
 * Check if a route is currently loading
 */
export function isRouteLoading(route: Route): boolean {
  return loadingCache.has(route);
}

/**
 * Check if a route is loaded
 */
export function isRouteLoaded(route: Route): boolean {
  return componentCache.has(route) || !route.lazy;
}