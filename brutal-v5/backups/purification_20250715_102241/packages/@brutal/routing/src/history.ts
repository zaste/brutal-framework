/**
 * History implementations for different modes
 */

import { History, HistoryState } from './types';

// Generate unique keys for history entries
let keyCounter = 0;
function genKey(): string {
  return String(++keyCounter);
}

// Parse query string
function parseQuery(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (query) {
    query.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
  }
  
  return params;
}

// Base history class
abstract class BaseHistory implements History {
  current: string = '';
  state: HistoryState = { key: genKey() };
  listeners = new Set<(path: string, state: HistoryState) => void>();
  
  abstract push(path: string, state?: HistoryState): void;
  abstract replace(path: string, state?: HistoryState): void;
  abstract go(n: number): void;
  
  listen(callback: (path: string, state: HistoryState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notify(path: string, state: HistoryState): void {
    this.listeners.forEach(cb => cb(path, state));
  }
  
  destroy(): void {
    this.listeners.clear();
  }
}

// HTML5 History API
export class HTML5History extends BaseHistory {
  private base: string;
  private popstateHandler?: (e: PopStateEvent) => void;
  
  constructor(base = '') {
    super();
    this.base = base;
    this.current = this.getPath();
    this.state = window.history.state || { key: genKey() };
    
    // Listen for popstate events
    this.popstateHandler = (e: PopStateEvent) => {
      const state = e.state || { key: genKey() };
      const path = this.getPath();
      
      this.current = path;
      this.state = state;
      this.notify(path, state);
    };
    
    window.addEventListener('popstate', this.popstateHandler);
  }
  
  private getPath(): string {
    let path = window.location.pathname;
    
    if (this.base && path.startsWith(this.base)) {
      path = path.slice(this.base.length);
    }
    
    return (path || '/') + window.location.search + window.location.hash;
  }
  
  private getUrl(path: string): string {
    return this.base + path;
  }
  
  push(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    try {
      window.history.pushState(state, '', this.getUrl(path));
      this.current = path;
      this.state = state;
      this.notify(path, state);
    } catch (e) {
      window.location.href = this.getUrl(path);
    }
  }
  
  replace(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    try {
      window.history.replaceState(state, '', this.getUrl(path));
      this.current = path;
      this.state = state;
      this.notify(path, state);
    } catch (e) {
      window.location.replace(this.getUrl(path));
    }
  }
  
  go(n: number): void {
    window.history.go(n);
  }
  
  destroy(): void {
    super.destroy();
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
    }
  }
}

// Hash-based history
export class HashHistory extends BaseHistory {
  private hashchangeHandler?: () => void;
  
  constructor() {
    super();
    this.current = this.getPath();
    
    // Ensure we have a hash
    if (!window.location.hash) {
      window.location.replace('#/');
    }
    
    // Listen for hashchange events
    this.hashchangeHandler = () => {
      const path = this.getPath();
      const state = { key: genKey() };
      
      this.current = path;
      this.state = state;
      this.notify(path, state);
    };
    
    window.addEventListener('hashchange', this.hashchangeHandler);
  }
  
  private getPath(): string {
    // Remove # from hash
    const hash = window.location.hash.slice(1);
    return hash || '/';
  }
  
  push(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    window.location.hash = path;
    this.current = path;
    this.state = state;
    // Note: hashchange event will fire automatically
  }
  
  replace(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    const url = window.location.href.replace(/#.*/, '') + '#' + path;
    window.location.replace(url);
    this.current = path;
    this.state = state;
  }
  
  go(n: number): void {
    window.history.go(n);
  }
  
  destroy(): void {
    super.destroy();
    if (this.hashchangeHandler) {
      window.removeEventListener('hashchange', this.hashchangeHandler);
    }
  }
}

// Memory history (for testing/SSR)
export class MemoryHistory extends BaseHistory {
  private stack: Array<{ path: string; state: HistoryState }> = [];
  private index = 0;
  
  constructor(initialPath = '/') {
    super();
    this.current = initialPath;
    this.state = { key: genKey() };
    this.stack.push({ path: initialPath, state: this.state });
  }
  
  push(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    // Remove future entries
    this.stack = this.stack.slice(0, this.index + 1);
    
    // Add new entry
    this.stack.push({ path, state });
    this.index++;
    
    this.current = path;
    this.state = state;
    this.notify(path, state);
  }
  
  replace(path: string, state?: HistoryState): void {
    state = state || { key: genKey() };
    
    // Replace current entry
    this.stack[this.index] = { path, state };
    
    this.current = path;
    this.state = state;
    this.notify(path, state);
  }
  
  go(n: number): void {
    const targetIndex = this.index + n;
    
    if (targetIndex >= 0 && targetIndex < this.stack.length) {
      this.index = targetIndex;
      const entry = this.stack[this.index];
      
      this.current = entry.path;
      this.state = entry.state;
      this.notify(entry.path, entry.state);
    }
  }
  
  canGo(n: number): boolean {
    const targetIndex = this.index + n;
    return targetIndex >= 0 && targetIndex < this.stack.length;
  }
}

// Factory function
export function createHistory(mode: 'history' | 'hash' | 'memory' = 'history', options: any = {}): History {
  switch (mode) {
    case 'hash':
      return new HashHistory();
    case 'memory':
      return new MemoryHistory(options.initialPath);
    case 'history':
    default:
      return new HTML5History(options.base);
  }
}