/**
 * Computed property implementation with auto-tracking
 */

import type { ComputedOptions, ComputedProperty } from './types.js';
import { globalTracker } from './tracker.js';

export class Computed<T> implements ComputedProperty<T> {
  private cached = false;
  private cachedValue?: T;
  private dependencies = new Set<string>();
  private computation: () => T;
  private options: Required<ComputedOptions>;

  constructor(computation: () => T, options: ComputedOptions = {}) {
    this.computation = computation;
    this.options = {
      memoize: options.memoize ?? true,
      equals: options.equals ?? Object.is,
      debug: options.debug ?? false
    };
  }

  get(): T {
    if (this.cached && this.options.memoize) {
      if (this.options.debug) {
        console.log('[Computed] Returning cached value');
      }
      return this.cachedValue!;
    }

    // Track dependencies during computation
    globalTracker.startTracking();
    
    try {
      const value = this.computation();
      
      // Get tracked dependencies
      const newDeps = globalTracker.stopTracking();
      this.dependencies = newDeps;
      
      if (this.options.memoize) {
        // Check if value changed
        if (!this.cached || !this.options.equals(this.cachedValue, value)) {
          this.cachedValue = value;
          this.cached = true;
        }
      }
      
      if (this.options.debug) {
        console.log('[Computed] Computed with dependencies:', Array.from(this.dependencies));
      }
      
      return value;
    } catch (error) {
      globalTracker.stopTracking();
      throw error;
    }
  }

  invalidate(): void {
    this.cached = false;
    this.cachedValue = undefined;
    if (this.options.debug) {
      console.log('[Computed] Cache invalidated');
    }
  }

  isCached(): boolean {
    return this.cached;
  }

  getDependencies(): Set<string> {
    return new Set(this.dependencies);
  }
}

/**
 * Create a computed property
 */
export function computed<T>(
  computation: () => T, 
  options?: ComputedOptions
): ComputedProperty<T> {
  return new Computed(computation, options);
}