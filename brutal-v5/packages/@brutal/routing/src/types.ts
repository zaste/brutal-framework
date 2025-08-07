/**
 * Core routing types
 */

export interface RouteParams {
  [key: string]: string | undefined;
}

export interface RouteQuery {
  [key: string]: string | string[] | undefined;
}

export interface RouteLocation {
  path: string;
  params: RouteParams;
  query: RouteQuery;
  hash: string;
  fullPath: string;
  matched?: Route;
  state?: any;
}

export interface Route {
  path: string;
  name?: string;
  component?: any;
  redirect?: string | ((to: RouteLocation) => string);
  beforeEnter?: NavigationGuard | NavigationGuard[];
  meta?: Record<string, any>;
  children?: Route[];
  // Lazy loading
  lazy?: () => Promise<any>;
  loading?: any;
  error?: any;
  // Computed properties
  regex?: RegExp;
  keys?: string[];
  parent?: Route;
}

export interface NavigationGuard {
  (
    to: RouteLocation,
    from: RouteLocation,
    next: NavigationGuardNext
  ): void | Promise<void>;
}

export interface NavigationGuardNext {
  (): void;
  (error: Error): void;
  (location: string | RouteLocation): void;
  (valid: boolean): void;
}

export interface NavigationHook {
  (to: RouteLocation, from: RouteLocation): void;
}

export interface RouterOptions {
  routes: Route[];
  mode?: 'history' | 'hash' | 'memory';
  base?: string;
  linkActiveClass?: string;
  linkExactActiveClass?: string;
  scrollBehavior?: (
    to: RouteLocation,
    from: RouteLocation,
    savedPosition?: { x: number; y: number } | null
  ) => { x: number; y: number } | { selector: string } | void;
  fallback?: boolean;
}

export interface Router {
  // Properties
  currentRoute: RouteLocation;
  options: RouterOptions;
  mode: 'history' | 'hash' | 'memory';
  
  // Navigation methods
  push(location: string | RouteLocation): Promise<void>;
  replace(location: string | RouteLocation): Promise<void>;
  go(n: number): void;
  back(): void;
  forward(): void;
  
  // Route resolution
  match(path: string): RouteLocation | null;
  resolve(location: string | RouteLocation): RouteLocation;
  addRoute(route: Route, parent?: Route): void;
  removeRoute(name: string): void;
  hasRoute(name: string): boolean;
  getRoute(name: string): Route | undefined;
  
  // Guards and hooks
  beforeEach(guard: NavigationGuard): () => void;
  afterEach(hook: NavigationHook): () => void;
  beforeResolve(guard: NavigationGuard): () => void;
  
  // Lifecycle
  init(): void;
  destroy(): void;
  
  // Events
  onReady(callback: () => void): void;
  onError(callback: (error: Error) => void): void;
}

export interface HistoryState {
  key: string;
  [key: string]: any;
}

export interface History {
  current: string;
  state: HistoryState;
  
  push(path: string, state?: HistoryState): void;
  replace(path: string, state?: HistoryState): void;
  go(n: number): void;
  
  listen(callback: (path: string, state: HistoryState) => void): () => void;
  destroy(): void;
}

// Matcher types
export interface RouteMatcher {
  match(path: string): { params: RouteParams; route: Route } | null;
  addRoute(route: Route): void;
  removeRoute(name: string): void;
  getRoutes(): Route[];
}

// Link component props
export interface RouterLinkProps {
  to: string | RouteLocation;
  replace?: boolean;
  tag?: string;
  activeClass?: string;
  exactActiveClass?: string;
  event?: string | string[];
  exact?: boolean;
}

// Router view component props
export interface RouterViewProps {
  name?: string;
  route?: RouteLocation;
}