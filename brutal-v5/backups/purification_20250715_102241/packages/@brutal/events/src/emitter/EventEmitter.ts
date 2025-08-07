/**
 * Typed event emitter for BRUTAL V5
 * Supports wildcard events, once listeners, and async handlers
 */

import type { EventHandler, EventMap, WildcardHandler } from '../types/index.js';

export interface EmitterOptions {
  maxListeners?: number;
  wildcard?: boolean;
  verboseErrors?: boolean;
  async?: boolean;
}

const DEFAULT_OPTIONS: EmitterOptions = {
  maxListeners: 100,
  wildcard: true,
  verboseErrors: false,
  async: false
};

export class EventEmitter<T extends EventMap = EventMap> {
  private events = new Map<keyof T | '*', Set<EventHandler<any>>>();
  private onceEvents = new Map<keyof T | '*', Set<EventHandler<any>>>();
  private options: EmitterOptions;
  private listenerCounts = new Map<keyof T | '*', number>();
  
  constructor(options?: EmitterOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Add event listener
   */
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  on(event: '*', handler: WildcardHandler<T>): () => void;
  on<K extends keyof T | '*'>(
    event: K,
    handler: K extends '*' ? WildcardHandler<T> : EventHandler<T[K]>
  ): () => void {
    this.addListener(event, handler as any, false);
    return () => this.off(event, handler as any);
  }
  
  /**
   * Add one-time event listener
   */
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  once(event: '*', handler: WildcardHandler<T>): () => void;
  once<K extends keyof T | '*'>(
    event: K,
    handler: K extends '*' ? WildcardHandler<T> : EventHandler<T[K]>
  ): () => void {
    this.addListener(event, handler as any, true);
    return () => this.off(event, handler as any);
  }
  
  /**
   * Remove event listener
   */
  off<K extends keyof T>(event: K, handler?: EventHandler<T[K]>): void;
  off(event: '*', handler?: WildcardHandler<T>): void;
  off<K extends keyof T | '*'>(
    event: K,
    handler?: K extends '*' ? WildcardHandler<T> : EventHandler<T[K]>
  ): void {
    if (!handler) {
      // Remove all listeners for event
      this.events.delete(event);
      this.onceEvents.delete(event);
      this.listenerCounts.delete(event);
      return;
    }
    
    this.events.get(event)?.delete(handler as any);
    this.onceEvents.get(event)?.delete(handler as any);
    this.updateListenerCount(event);
  }
  
  /**
   * Emit event
   */
  emit<K extends keyof T>(event: K, data: T[K]): void {
    if (this.options.async) {
      this.emitAsync(event, data);
    } else {
      this.emitSync(event, data);
    }
  }
  
  /**
   * Emit event asynchronously
   */
  async emitAsync<K extends keyof T>(event: K, data: T[K]): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // Handle specific event listeners
    const handlers = this.events.get(event);
    if (handlers) {
      for (const handler of handlers) {
        promises.push(this.callHandlerAsync(handler, data, event));
      }
    }
    
    // Handle once listeners
    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      this.onceEvents.delete(event);
      for (const handler of onceHandlers) {
        promises.push(this.callHandlerAsync(handler, data, event));
      }
    }
    
    // Handle wildcard listeners
    if (this.options.wildcard && event !== '*') {
      const wildcardHandlers = this.events.get('*');
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          promises.push(this.callHandlerAsync(handler as WildcardHandler<T>, data, event));
        }
      }
      
      const wildcardOnceHandlers = this.onceEvents.get('*');
      if (wildcardOnceHandlers) {
        for (const handler of wildcardOnceHandlers) {
          promises.push(this.callHandlerAsync(handler as WildcardHandler<T>, data, event));
        }
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Clear all listeners
   */
  clear(event?: keyof T | '*'): void {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
      this.listenerCounts.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
      this.listenerCounts.clear();
    }
  }
  
  /**
   * Get listener count
   */
  listenerCount(event?: keyof T | '*'): number {
    if (event) {
      return this.listenerCounts.get(event) || 0;
    }
    
    let total = 0;
    for (const count of this.listenerCounts.values()) {
      total += count;
    }
    return total;
  }
  
  /**
   * Get all event names
   */
  eventNames(): (keyof T | '*')[] {
    const names = new Set<keyof T | '*'>();
    for (const key of this.events.keys()) {
      names.add(key);
    }
    for (const key of this.onceEvents.keys()) {
      names.add(key);
    }
    return Array.from(names);
  }
  
  /**
   * Wait for event
   */
  waitFor<K extends keyof T>(
    event: K,
    timeout?: number
  ): Promise<T[K]> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      const cleanup = this.once(event, (data) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(data);
      });
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for event: ${String(event)}`));
        }, timeout);
      }
    });
  }
  
  // Private methods
  
  private emitSync<K extends keyof T>(event: K, data: T[K]): void {
    // Handle specific event listeners
    const handlers = this.events.get(event);
    if (handlers) {
      for (const handler of handlers) {
        this.callHandlerSync(handler, data, event);
      }
    }
    
    // Handle once listeners
    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      this.onceEvents.delete(event);
      for (const handler of onceHandlers) {
        this.callHandlerSync(handler, data, event);
      }
      this.updateListenerCount(event);
    }
    
    // Handle wildcard listeners
    if (this.options.wildcard && event !== '*') {
      const wildcardHandlers = this.events.get('*');
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          this.callHandlerSync(handler as WildcardHandler<T>, data, event);
        }
      }
      
      const wildcardOnceHandlers = this.onceEvents.get('*');
      if (wildcardOnceHandlers) {
        for (const handler of wildcardOnceHandlers) {
          this.callHandlerSync(handler as WildcardHandler<T>, data, event);
        }
      }
    }
  }
  
  private addListener<K extends keyof T | '*'>(
    event: K,
    handler: EventHandler<any>,
    once: boolean
  ): void {
    const map = once ? this.onceEvents : this.events;
    
    if (!map.has(event)) {
      map.set(event, new Set());
    }
    
    const handlers = map.get(event)!;
    handlers.add(handler);
    
    this.updateListenerCount(event);
    
    // Check max listeners
    if (this.options.maxListeners && this.listenerCounts.get(event)! > this.options.maxListeners) {
      console.warn(
        `MaxListenersExceeded: Event '${String(event)}' has ${this.listenerCounts.get(event)} listeners. ` +
        `Maximum is ${this.options.maxListeners}.`
      );
    }
  }
  
  private updateListenerCount(event: keyof T | '*'): void {
    const regularCount = this.events.get(event)?.size || 0;
    const onceCount = this.onceEvents.get(event)?.size || 0;
    const total = regularCount + onceCount;
    
    if (total > 0) {
      this.listenerCounts.set(event, total);
    } else {
      this.listenerCounts.delete(event);
    }
  }
  
  private callHandlerSync(handler: Function, data: any, event: any): void {
    try {
      handler(data, event);
    } catch (error) {
      if (this.options.verboseErrors) {
        console.error(`Error in event handler for '${String(event)}':`, error);
      } else {
        console.error(`Error in event handler for '${String(event)}'`);
      }
    }
  }
  
  private async callHandlerAsync(handler: Function, data: any, event: any): Promise<void> {
    try {
      await handler(data, event);
    } catch (error) {
      if (this.options.verboseErrors) {
        console.error(`Error in event handler for '${String(event)}':`, error);
      } else {
        console.error(`Error in event handler for '${String(event)}'`);
      }
    }
  }
}
