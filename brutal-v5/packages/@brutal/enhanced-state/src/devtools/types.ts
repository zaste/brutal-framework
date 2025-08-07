/**
 * Types for DevTools integration
 */

export interface DevToolsOptions {
  /** Name for the store instance */
  name?: string;
  /** Enable action logging */
  logActions?: boolean;
  /** Enable state diff */
  diff?: boolean;
  /** Maximum log entries */
  maxLogEntries?: number;
}

export interface StateChange<T> {
  /** Previous state */
  prevState: T;
  /** Next state */
  nextState: T;
  /** Action that caused the change */
  action?: {
    type: string;
    payload?: unknown;
  };
  /** Timestamp of change */
  timestamp: number;
}

export interface DevToolsInspector<T> {
  /** Log a state change */
  logStateChange(change: StateChange<T>): void;
  /** Get state history */
  getHistory(): StateChange<T>[];
  /** Clear history */
  clearHistory(): void;
  /** Export state snapshot */
  exportState(): string;
  /** Import state snapshot */
  importState(snapshot: string): T;
}