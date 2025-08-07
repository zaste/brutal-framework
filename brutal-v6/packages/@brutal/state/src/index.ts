/**
 * @brutal/state - Global state management
 * Target: 1KB
 * 
 * Zero-ceremony state management that just works
 */

export { createStore } from './store';
export { withStore } from './with-store';

// Types
export type { Store, StoreConfig, Subscriber } from './types';