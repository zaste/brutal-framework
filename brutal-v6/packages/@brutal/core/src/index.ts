/**
 * @brutal/core - Core composition utilities
 * 
 * The foundation of the BRUTAL framework
 */

// Main exports
export { compose } from './compose';
export { 
  withState, 
  withEvents, 
  withLifecycle, 
  withProps
} from './behaviors';

// Type exports
export type {
  BrutalElement,
  Behavior,
  StateOptions,
  EventMap,
  Lifecycle
} from './types';