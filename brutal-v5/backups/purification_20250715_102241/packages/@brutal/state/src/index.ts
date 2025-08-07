/**
 * @brutal/state - Ultra-lightweight state management
 * 
 * Global state management with TypeScript support,
 * devtools integration, and React bindings.
 * 
 * @packageDocumentation
 */

// Export minimal implementation for production
export { 
  c as createStore, 
  h as shallow,
  l as createSelector,
  d as devtools,
  p as persist
} from './minimal';

// Type exports from full implementation
export type {
  State,
  StoreApi,
  StoreCreator,
  StateListener,
  StateSelector,
  EqualityFn,
  StateMiddleware,
  MiddlewareConfig,
  DevtoolsConfig,
  PersistConfig,
  ComputedValue,
  UseBoundStore,
  SubscribeWithSelector,
  TimeTravelState,
  TimeTravelActions
} from './types';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/state';