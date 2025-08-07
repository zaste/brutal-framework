/**
 * Dependency tracking for computed properties
 */

import type { DependencyTracker } from './types.js';

export class DependencyTrackerImpl implements DependencyTracker {
  private tracking = false;
  private dependencies = new Set<string>();

  startTracking(): void {
    this.tracking = true;
    this.dependencies.clear();
  }

  stopTracking(): Set<string> {
    this.tracking = false;
    const deps = new Set(this.dependencies);
    this.dependencies.clear();
    return deps;
  }

  track(path: string): void {
    if (this.tracking) {
      this.dependencies.add(path);
    }
  }

  isTracking(): boolean {
    return this.tracking;
  }
}

// Global tracker instance
export const globalTracker = new DependencyTrackerImpl();