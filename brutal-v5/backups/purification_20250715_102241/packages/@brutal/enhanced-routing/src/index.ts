/**
 * @brutal/enhanced-routing - Enhanced routing with guards, transitions, and nested routes
 * 
 * @packageDocumentation
 */

// Route guards
export { 
  RouteGuard,
  createGuard,
  type GuardContext,
  type GuardResult
} from './guards/RouteGuard.js';

// Route transitions
export {
  RouteTransition,
  createTransition,
  type TransitionOptions,
  type TransitionState
} from './transitions/RouteTransition.js';

// Nested routing
export {
  NestedRouter,
  createNestedRoute,
  type NestedRouteConfig
} from './nested/NestedRouter.js';

// Enhanced router
export {
  EnhancedRouter,
  createEnhancedRouter,
  type EnhancedRouterOptions,
  type RouteConfig
} from './router/EnhancedRouter.js';

// Lazy loading
export {
  lazyRoute,
  type LazyRouteOptions
} from './lazy/LazyRoute.js';

// Navigation helpers
export {
  NavigationController,
  useNavigation,
  type NavigationOptions
} from './navigation/NavigationController.js';

// Route metadata
export {
  RouteMeta,
  setRouteMeta,
  getRouteMeta,
  type MetaData
} from './meta/RouteMeta.js';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/enhanced-routing';
