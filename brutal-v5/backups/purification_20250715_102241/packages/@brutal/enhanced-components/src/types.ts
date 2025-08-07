/**
 * Public types for @brutal/enhanced-components
 */

// Re-export types from modules
export type { AsyncComponentOptions } from './async/AsyncComponent.js';
export type { PortalOptions } from './portal/Portal.js';
export type { ObserverOptions } from './observer/ObserverComponent.js';
export type { LifecycleHook, LifecycleOptions } from './lifecycle/AdvancedLifecycle.js';

/**
 * Common error info for enhanced components
 */
export interface ComponentErrorInfo {
  /** The error that occurred */
  error: unknown;
  /** Phase where error occurred */
  phase: string;
  /** Component instance */
  component: HTMLElement;
  /** Timestamp of error */
  timestamp: number;
}

/**
 * Performance entry for component operations
 */
export interface ComponentPerformanceEntry {
  /** Measure name */
  measure: string;
  /** Duration in milliseconds */
  duration: number;
  /** Component instance */
  component: HTMLElement;
}
