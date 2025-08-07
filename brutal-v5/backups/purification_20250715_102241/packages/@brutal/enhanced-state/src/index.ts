/**
 * @brutal/enhanced-state - Advanced state management with time-travel, persistence, computed properties, devtools, and middleware
 * 
 * @packageDocumentation
 */

// Main store
export { createEnhancedStore } from './store.js';
export type { EnhancedStore, EnhancedStoreOptions } from './store.js';

// Time-travel
export { StateHistory } from './time-travel/index.js';
export type { 
  StateSnapshot, 
  HistoryOptions, 
  TimeTravel 
} from './time-travel/index.js';

// Persistence
export { 
  StatePersister,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryAdapter 
} from './persistence/index.js';
export type { 
  PersistenceAdapter, 
  PersistenceOptions, 
  PersistedState 
} from './persistence/index.js';

// Computed properties
export { computed, globalTracker } from './computed/index.js';
export type { 
  ComputedOptions, 
  ComputedProperty 
} from './computed/index.js';

// DevTools
export { StateInspector } from './devtools/index.js';
export type { 
  DevToolsOptions, 
  DevToolsInspector, 
  StateChange 
} from './devtools/index.js';

// Middleware
export { Pipeline, middleware } from './middleware/index.js';
export type { 
  Middleware, 
  MiddlewarePipeline, 
  MiddlewareContext 
} from './middleware/index.js';

// Re-export base types
export type { Store } from '@brutal/state';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/enhanced-state';
