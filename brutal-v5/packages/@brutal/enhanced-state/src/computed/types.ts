/**
 * Types for computed properties
 */

export interface ComputedOptions {
  /** Enable memoization (default: true) */
  memoize?: boolean;
  /** Custom equality check for memoization */
  equals?: (a: unknown, b: unknown) => boolean;
  /** Debug mode for tracking */
  debug?: boolean;
}

export interface ComputedProperty<T> {
  /** Get the computed value */
  get(): T;
  /** Invalidate cached value */
  invalidate(): void;
  /** Check if value is cached */
  isCached(): boolean;
}

export interface DependencyTracker {
  /** Start tracking dependencies */
  startTracking(): void;
  /** Stop tracking and get dependencies */
  stopTracking(): Set<string>;
  /** Record a dependency access */
  track(path: string): void;
  /** Check if currently tracking */
  isTracking(): boolean;
}