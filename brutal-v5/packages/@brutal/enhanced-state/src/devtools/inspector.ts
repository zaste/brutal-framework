/**
 * DevTools inspector for state debugging
 */

import type { DevToolsOptions, DevToolsInspector, StateChange } from './types.js';

export class StateInspector<T> implements DevToolsInspector<T> {
  private history: StateChange<T>[] = [];
  private options: Required<DevToolsOptions>;

  constructor(options: DevToolsOptions = {}) {
    this.options = {
      name: options.name ?? 'BrutalState',
      logActions: options.logActions ?? true,
      diff: options.diff ?? true,
      maxLogEntries: options.maxLogEntries ?? 100
    };

    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__BRUTAL_STATE_DEVTOOLS__ = (window as any).__BRUTAL_STATE_DEVTOOLS__ || {};
      (window as any).__BRUTAL_STATE_DEVTOOLS__[this.options.name] = this;
    }
  }

  logStateChange(change: StateChange<T>): void {
    this.history.push(change);

    // Maintain max entries limit
    if (this.history.length > this.options.maxLogEntries) {
      this.history = this.history.slice(-this.options.maxLogEntries);
    }

    // Console logging
    if (this.options.logActions && change.action) {
      console.group(
        `%c${this.options.name} %caction %c${change.action.type}`,
        'color: #9E9E9E; font-weight: bold',
        'color: #9E9E9E',
        'color: #03A9F4; font-weight: bold'
      );
      console.log('%cprev state', 'color: #9E9E9E', change.prevState);
      console.log('%caction', 'color: #03A9F4', change.action);
      console.log('%cnext state', 'color: #4CAF50', change.nextState);
      
      if (this.options.diff) {
        console.log('%cdiff', 'color: #E91E63', this.computeDiff(change.prevState, change.nextState));
      }
      
      console.groupEnd();
    }
  }

  getHistory(): StateChange<T>[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  exportState(): string {
    const snapshot = {
      name: this.options.name,
      timestamp: Date.now(),
      history: this.history,
      currentState: this.history.length > 0 
        ? this.history[this.history.length - 1].nextState 
        : null
    };
    return JSON.stringify(snapshot, null, 2);
  }

  importState(snapshot: string): T {
    const data = JSON.parse(snapshot);
    if (data.history && Array.isArray(data.history)) {
      this.history = data.history;
    }
    return data.currentState;
  }

  private computeDiff(prev: any, next: any): Record<string, any> {
    const diff: Record<string, any> = {};
    
    // Check removed/changed in prev
    for (const key in prev) {
      if (!(key in next)) {
        diff[key] = { removed: prev[key] };
      } else if (prev[key] !== next[key]) {
        diff[key] = { from: prev[key], to: next[key] };
      }
    }
    
    // Check added in next
    for (const key in next) {
      if (!(key in prev)) {
        diff[key] = { added: next[key] };
      }
    }
    
    return diff;
  }
}