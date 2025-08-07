/**
 * Global event bus for cross-component communication
 */

import { EventEmitter } from '../emitter/EventEmitter.js';
import type { EventMap, EventHandler, EventBusMessage } from '../types/index.js';
import { uniqueId } from '@brutal/shared';

export interface BusOptions {
  debug?: boolean;
  history?: boolean;
  maxHistory?: number;
}

export class EventBus<T extends EventMap = EventMap> extends EventEmitter<T> {
  private channels = new Map<string, EventEmitter<any>>();
  private history: EventBusMessage[] = [];
  private options: BusOptions;
  
  constructor(options: BusOptions = {}) {
    super({
      wildcard: true,
      async: true
    });
    
    this.options = {
      debug: false,
      history: false,
      maxHistory: 100,
      ...options
    };
  }
  
  /**
   * Create a namespaced channel
   */
  channel<C extends EventMap = EventMap>(name: string): EventEmitter<C> {
    if (!this.channels.has(name)) {
      const channel = new EventEmitter<C>({
        wildcard: true,
        async: true
      });
      this.channels.set(name, channel);
    }
    return this.channels.get(name)!;
  }
  
  /**
   * Remove a channel
   */
  removeChannel(name: string): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.clear();
      this.channels.delete(name);
    }
  }
  
  /**
   * Emit with metadata
   */
  send<K extends keyof T>(
    event: K,
    data: T[K],
    metadata?: { source?: string; target?: string }
  ): void {
    const message: EventBusMessage<T[K]> = {
      id: uniqueId('msg'),
      timestamp: Date.now(),
      event: String(event),
      data,
      source: metadata?.source,
      target: metadata?.target
    };
    
    if (this.options.history) {
      this.addToHistory(message);
    }
    
    if (this.options.debug) {
      console.log('[EventBus]', message);
    }
    
    // If target is specified, send to channel
    if (metadata?.target) {
      const channel = this.channels.get(metadata.target);
      if (channel) {
        channel.emit(event as any, data);
      }
    } else {
      // Broadcast to all
      this.emit(event, data);
    }
  }
  
  /**
   * Get event history
   */
  getHistory(filter?: {
    event?: string;
    source?: string;
    target?: string;
    since?: number;
  }): EventBusMessage[] {
    if (!filter) return [...this.history];
    
    return this.history.filter(msg => {
      if (filter.event && msg.event !== filter.event) return false;
      if (filter.source && msg.source !== filter.source) return false;
      if (filter.target && msg.target !== filter.target) return false;
      if (filter.since && msg.timestamp < filter.since) return false;
      return true;
    });
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }
  
  /**
   * Replay events from history
   */
  replay(filter?: Parameters<typeof this.getHistory>[0], speed = 1): void {
    const messages = this.getHistory(filter);
    
    if (messages.length === 0) return;
    
    const startTime = messages[0].timestamp;
    
    messages.forEach(msg => {
      const delay = (msg.timestamp - startTime) / speed;
      
      setTimeout(() => {
        if (msg.target) {
          this.send(msg.event as any, msg.data, {
            source: msg.source,
            target: msg.target
          });
        } else {
          this.emit(msg.event as any, msg.data);
        }
      }, delay);
    });
  }
  
  /**
   * Bridge two buses
   */
  bridge<B extends EventMap>(
    otherBus: EventBus<B>,
    options?: {
      events?: (keyof T | keyof B)[];
      transform?: (event: string, data: any) => any;
      filter?: (event: string, data: any) => boolean;
    }
  ): () => void {
    const handler = (data: any, event: string) => {
      if (options?.events && !options.events.includes(event as any)) return;
      if (options?.filter && !options.filter(event, data)) return;
      
      const transformedData = options?.transform ? options.transform(event, data) : data;
      otherBus.emit(event as any, transformedData);
    };
    
    const cleanup = this.on('*' as any, handler);
    
    return cleanup;
  }
  
  /**
   * Clear all
   */
  destroy(): void {
    this.clear();
    this.channels.forEach(channel => channel.clear());
    this.channels.clear();
    this.history = [];
  }
  
  private addToHistory(message: EventBusMessage): void {
    this.history.push(message);
    
    // Trim history if needed
    if (this.options.maxHistory && this.history.length > this.options.maxHistory) {
      this.history = this.history.slice(-this.options.maxHistory);
    }
  }
}

// Create global instance
export const globalBus = new EventBus({
  debug: false,
  history: true,
  maxHistory: 100
});