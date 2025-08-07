/**
 * @brutal/enhanced-components - Enhanced components using composition pattern
 * 
 * @packageDocumentation
 */

// Composition utilities
export {
  compose,
  createEnhancedComponent,
  withMixin,
  type ComponentEnhancer
} from './compose.js';

// Async enhancers
export {
  withAsyncLoading,
  type AsyncOptions
} from './async/async-enhancer.js';

// Observer enhancers
export {
  withLazyLoading,
  withVisibilityTracking
} from './observer/observer-enhancer.js';

// Portal enhancer
export {
  withPortal
} from './portal/portal-enhancer.js';

// Legacy exports for compatibility (will be deprecated)
export { 
  createAsyncComponent, 
  AsyncComponent,
  type AsyncComponentOptions 
} from './async/AsyncComponent.js';

export { 
  Portal,
  createPortal,
  usePortal,
  type PortalOptions
} from './portal/Portal.js';

export {
  ObserverComponent,
  LazyComponent,
  VisibilityTracker,
  type ObserverOptions
} from './observer/ObserverComponent.js';

export {
  LifecycleComponent,
  WithLifecycle,
  useLifecycle,
  type LifecycleHook,
  type LifecycleOptions
} from './lifecycle/AdvancedLifecycle.js';

// Re-export base component for convenience
export { BrutalComponent } from '@brutal/components';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/enhanced-components';