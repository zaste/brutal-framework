/**
 * Core router implementation
 */

import type {
  Router,
  RouterOptions,
  Route,
  RouteLocation,
  RouteParams,
  RouteQuery,
  NavigationGuard,
  NavigationGuardNext,
  NavigationHook,
  History
} from './types';
import { createMatcher } from './matcher';
import type { RouteMatcher } from './matcher';
import { createHistory } from './history';

// Parse query string
function parseQuery(query: string): RouteQuery {
  const params: RouteQuery = {};
  
  if (query) {
    query.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = value ? decodeURIComponent(value) : '';
        
        // Handle array values
        if (params[decodedKey]) {
          if (Array.isArray(params[decodedKey])) {
            (params[decodedKey] as string[]).push(decodedValue);
          } else {
            params[decodedKey] = [params[decodedKey] as string, decodedValue];
          }
        } else {
          params[decodedKey] = decodedValue;
        }
      }
    });
  }
  
  return params;
}

// Stringify query object
function stringifyQuery(query: RouteQuery): string {
  const parts: string[] = [];
  
  for (const key in query) {
    const value = query[key];
    if (value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach(v => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  
  return parts.length ? '?' + parts.join('&') : '';
}

// Parse path into location
function parsePath(path: string): { pathname: string; query: string; hash: string } {
  let pathname = path;
  let query = '';
  let hash = '';
  
  // Extract hash
  const hashIndex = pathname.indexOf('#');
  if (hashIndex >= 0) {
    hash = pathname.slice(hashIndex);
    pathname = pathname.slice(0, hashIndex);
  }
  
  // Extract query
  const queryIndex = pathname.indexOf('?');
  if (queryIndex >= 0) {
    query = pathname.slice(queryIndex + 1);
    pathname = pathname.slice(0, queryIndex);
  }
  
  return { pathname, query, hash };
}

// Create empty route location
function createLocation(
  path: string,
  params: RouteParams = {},
  query: RouteQuery = {},
  hash = '',
  matched?: Route
): RouteLocation {
  return {
    path,
    params,
    query,
    hash,
    fullPath: path + stringifyQuery(query) + hash,
    matched
  };
}

export class BrutalRouter implements Router {
  currentRoute: RouteLocation;
  options: RouterOptions;
  mode: 'history' | 'hash' | 'memory';
  
  private matcher: RouteMatcher;
  private history: History;
  private ready = false;
  private readyCallbacks: Array<() => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  
  // Navigation guards
  private beforeHooks: NavigationGuard[] = [];
  private resolveHooks: NavigationGuard[] = [];
  private afterHooks: NavigationHook[] = [];
  
  constructor(options: RouterOptions) {
    
    this.options = options;
    this.mode = options.mode || 'history';
    
    // Create route matcher
    this.matcher = createMatcher(options.routes);
    
    // Create history
    this.history = createHistory(this.mode, {
      base: options.base,
      fallback: options.fallback
    });
    
    // Initialize current route
    this.currentRoute = createLocation('/');
  }
  
  init(): void {
    const initLocation = this.history.current;
    
    // Listen to history changes
    this.history.listen((path, state) => {
      this.transitionTo(path, () => {
        if (this.options.scrollBehavior) {
          // Handle scroll behavior
          const savedPosition = state && state.scroll;
          this.handleScroll(this.currentRoute, savedPosition);
        }
      });
    });
    
    // Initial navigation
    this.transitionTo(initLocation, () => {
      this.ready = true;
      this.readyCallbacks.forEach(cb => cb());
    });
  }
  
  // Navigation methods
  async push(location: string | RouteLocation): Promise<void> {
    return this.navigate(location, false);
  }
  
  async replace(location: string | RouteLocation): Promise<void> {
    return this.navigate(location, true);
  }
  
  private async navigate(
    location: string | RouteLocation,
    replace: boolean
  ): Promise<void> {
    const resolved = this.resolve(location);
    
    return new Promise((resolve, reject) => {
      this.transitionTo(resolved.fullPath, () => {
        if (replace) {
          this.history.replace(resolved.fullPath);
        } else {
          this.history.push(resolved.fullPath);
        }
        resolve();
      }, reject);
    });
  }
  
  go(n: number): void {
    this.history.go(n);
  }
  
  back(): void {
    this.go(-1);
  }
  
  forward(): void {
    this.go(1);
  }
  
  // Route resolution
  match(path: string): RouteLocation | null {
    const { pathname, query, hash } = parsePath(path);
    const matched = this.matcher.match(pathname);
    
    if (!matched) return null;
    
    return createLocation(
      pathname,
      matched.params,
      parseQuery(query),
      hash,
      matched.route
    );
  }
  
  resolve(location: string | RouteLocation): RouteLocation {
    if (typeof location === 'string') {
      const matched = this.match(location);
      if (!matched) {
        // Create location even if no route matched
        const { pathname, query, hash } = parsePath(location);
        return createLocation(pathname, {}, parseQuery(query), hash);
      }
      return matched;
    }
    
    return location;
  }
  
  // Route management
  addRoute(route: Route, _parent?: Route): void {
    this.matcher.addRoute(route);
  }
  
  removeRoute(name: string): void {
    this.matcher.removeRoute(name);
  }
  
  hasRoute(name: string): boolean {
    return this.matcher.getRoutes().some((r: Route) => r.name === name);
  }
  
  getRoute(name: string): Route | undefined {
    return this.matcher.getRoutes().find((r: Route) => r.name === name);
  }
  
  // Guards and hooks
  beforeEach(guard: NavigationGuard): () => void {
    this.beforeHooks.push(guard);
    return () => {
      const index = this.beforeHooks.indexOf(guard);
      if (index > -1) this.beforeHooks.splice(index, 1);
    };
  }
  
  afterEach(hook: NavigationHook): () => void {
    this.afterHooks.push(hook);
    return () => {
      const index = this.afterHooks.indexOf(hook);
      if (index > -1) this.afterHooks.splice(index, 1);
    };
  }
  
  beforeResolve(guard: NavigationGuard): () => void {
    this.resolveHooks.push(guard);
    return () => {
      const index = this.resolveHooks.indexOf(guard);
      if (index > -1) this.resolveHooks.splice(index, 1);
    };
  }
  
  // Internal transition
  private transitionTo(
    path: string,
    onComplete?: () => void,
    onAbort?: (err: Error) => void
  ): void {
    const route = this.match(path);
    
    if (!route) {
      onAbort?.(new Error(`No matching route for ${path}`));
      return;
    }
    
    this.confirmTransition(route, () => {
      const prev = this.currentRoute;
      this.currentRoute = route;
      
      // Call after hooks
      this.afterHooks.forEach(hook => hook(route, prev));
      
      // Trigger any listeners (removed EventEmitter dependency)
      
      onComplete?.();
    }, onAbort);
  }
  
  // Confirm navigation with guards
  private confirmTransition(
    route: RouteLocation,
    onComplete: () => void,
    onAbort?: (err: Error) => void
  ): void {
    const current = this.currentRoute;
    
    // Check if same route
    if (
      current.path === route.path &&
      JSON.stringify(current.params) === JSON.stringify(route.params) &&
      JSON.stringify(current.query) === JSON.stringify(route.query)
    ) {
      onComplete();
      return;
    }
    
    // Run guards
    const guards = [
      ...this.beforeHooks,
      ...(route.matched?.beforeEnter ? [].concat(route.matched.beforeEnter as any) : []),
      ...this.resolveHooks
    ];
    
    this.runGuards(guards, route, current, (err?: Error) => {
      if (err) {
        onAbort?.(err);
      } else {
        onComplete();
      }
    });
  }
  
  // Run navigation guards
  private runGuards(
    guards: NavigationGuard[],
    to: RouteLocation,
    from: RouteLocation,
    onComplete: (err?: Error) => void
  ): void {
    const runGuard = (index: number) => {
      if (index >= guards.length) {
        onComplete();
        return;
      }
      
      const guard = guards[index];
      const next: NavigationGuardNext = (arg?: any) => {
        if (arg === false) {
          // Navigation cancelled
          onComplete(new Error('Navigation cancelled'));
        } else if (arg instanceof Error) {
          onComplete(arg);
        } else if (typeof arg === 'string' || typeof arg === 'object') {
          // Redirect
          onComplete(new Error(`Redirected to ${arg}`));
        } else {
          // Continue to next guard
          runGuard(index + 1);
        }
      };
      
      try {
        if (guard) {
          const result = guard(to, from, next);
          
          // Handle promise return
          if (result && typeof result.then === 'function') {
            result.then(() => next()).catch((err: any) => next(err));
          }
        }
      } catch (err) {
        next(err as Error);
      }
    };
    
    runGuard(0);
  }
  
  // Handle scroll behavior
  private handleScroll(
    to: RouteLocation,
    savedPosition?: { x: number; y: number } | null
  ): void {
    if (!this.options.scrollBehavior) return;
    
    const position = this.options.scrollBehavior(to, this.currentRoute, savedPosition);
    
    if (!position) return;
    
    if ('selector' in position) {
      const el = document.querySelector(position.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
    }
  }
  
  // Lifecycle
  destroy(): void {
    this.history.destroy();
    this.beforeHooks = [];
    this.resolveHooks = [];
    this.afterHooks = [];
    this.readyCallbacks = [];
    this.errorCallbacks = [];
  }
  
  // Events
  onReady(callback: () => void): void {
    if (this.ready) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }
  
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }
}

// Factory function
export function createRouter(options: RouterOptions): Router {
  return new BrutalRouter(options);
}