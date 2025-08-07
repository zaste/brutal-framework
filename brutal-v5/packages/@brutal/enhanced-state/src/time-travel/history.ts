/**
 * State history management for time-travel
 */

import type { StateSnapshot, HistoryOptions, TimeTravel } from './types.js';

export class StateHistory<T> implements TimeTravel<T> {
  private snapshots: StateSnapshot<T>[] = [];
  private currentIndex = -1;
  private readonly options: Required<HistoryOptions>;

  constructor(options: HistoryOptions = {}) {
    this.options = {
      maxSnapshots: options.maxSnapshots ?? 50,
      trackActions: options.trackActions ?? true,
      serializer: options.serializer ?? ((state: T) => structuredClone(state))
    };
  }

  snapshot(state: T, action?: { type: string; payload?: unknown }): void {
    // Remove any forward history when taking new snapshot
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }

    const snapshot: StateSnapshot<T> = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      state: this.options.serializer(state),
      action: this.options.trackActions ? action : undefined
    };

    this.snapshots.push(snapshot);
    this.currentIndex++;

    // Maintain max snapshots limit
    if (this.snapshots.length > this.options.maxSnapshots) {
      const overflow = this.snapshots.length - this.options.maxSnapshots;
      this.snapshots = this.snapshots.slice(overflow);
      this.currentIndex = Math.max(0, this.currentIndex - overflow);
    }
  }

  back(steps = 1): T | undefined {
    const newIndex = Math.max(0, this.currentIndex - steps);
    if (newIndex !== this.currentIndex && this.snapshots[newIndex]) {
      this.currentIndex = newIndex;
      return this.snapshots[newIndex].state;
    }
    return undefined;
  }

  forward(steps = 1): T | undefined {
    const newIndex = Math.min(this.snapshots.length - 1, this.currentIndex + steps);
    if (newIndex !== this.currentIndex && this.snapshots[newIndex]) {
      this.currentIndex = newIndex;
      return this.snapshots[newIndex].state;
    }
    return undefined;
  }

  goto(snapshotId: string): T | undefined {
    const index = this.snapshots.findIndex(s => s.id === snapshotId);
    if (index !== -1) {
      this.currentIndex = index;
      return this.snapshots[index].state;
    }
    return undefined;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getHistory(): StateSnapshot<T>[] {
    return this.snapshots;
  }

  clear(): void {
    this.snapshots = [];
    this.currentIndex = -1;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }
}