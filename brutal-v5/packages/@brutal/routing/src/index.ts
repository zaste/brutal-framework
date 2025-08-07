/**
 * @brutal/routing - Ultra-lightweight client-side routing
 * 
 * SPA routing with history management, nested routes,
 * guards, and lazy loading support.
 * 
 * @packageDocumentation
 */

// Export minimal implementation with proper names
export { r as createRouter } from './minimal';

// Re-export types from full implementation for compatibility
export type { BrutalRouter } from './router';
export type { HTML5History, HashHistory, MemoryHistory } from './history';

// Type exports
export type {
  Route,
  RouteParams,
  RouteQuery,
  RouteLocation,
  Router,
  RouterOptions,
  NavigationGuard,
  NavigationGuardNext,
  NavigationHook,
  History,
  HistoryState,
  RouteMatcher,
  RouterLinkProps,
  RouterViewProps
} from './types';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/routing';