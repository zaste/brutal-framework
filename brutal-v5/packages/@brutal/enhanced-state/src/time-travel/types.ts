/**
 * Types for time-travel functionality
 */

export interface StateSnapshot<T> {
  /** Unique identifier for the snapshot */
  id: string;
  /** Timestamp when snapshot was taken */
  timestamp: number;
  /** The state at this point in time */
  state: T;
  /** Optional action that led to this state */
  action?: {
    type: string;
    payload?: unknown;
  };
}

export interface HistoryOptions {
  /** Maximum number of snapshots to keep (default: 50) */
  maxSnapshots?: number;
  /** Enable action tracking (default: true) */
  trackActions?: boolean;
  /** Custom serializer for states */
  serializer?: <T>(state: T) => T;
}

export interface TimeTravel<T> {
  /** Take a snapshot of current state */
  snapshot(state: T, action?: { type: string; payload?: unknown }): void;
  /** Go back n steps in history */
  back(steps?: number): T | undefined;
  /** Go forward n steps in history */
  forward(steps?: number): T | undefined;
  /** Jump to specific snapshot */
  goto(snapshotId: string): T | undefined;
  /** Get current position in history */
  getCurrentIndex(): number;
  /** Get all snapshots */
  getHistory(): StateSnapshot<T>[];
  /** Clear history */
  clear(): void;
  /** Check if can go back */
  canUndo(): boolean;
  /** Check if can go forward */
  canRedo(): boolean;
}