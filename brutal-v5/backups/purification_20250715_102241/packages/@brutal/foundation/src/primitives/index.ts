/**
 * Core primitives for BRUTAL foundation
 * These are the fundamental building blocks used throughout the framework
 */

/**
 * Event emitter primitive
 */
export class EventEmitter<T extends Record<string, any[]> = Record<string, any[]>> {
  private events = new Map<keyof T, Set<Function>>();
  
  on<K extends keyof T>(event: K, handler: (...args: T[K]) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  once<K extends keyof T>(event: K, handler: (...args: T[K]) => void): () => void {
    const wrapped = (...args: T[K]) => {
      handler(...args);
      this.off(event, wrapped);
    };
    
    return this.on(event, wrapped);
  }
  
  off<K extends keyof T>(event: K, handler: Function): void {
    this.events.get(event)?.delete(handler);
  }
  
  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    this.events.get(event)?.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
      }
    });
  }
  
  clear(event?: keyof T): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  listenerCount(event: keyof T): number {
    return this.events.get(event)?.size || 0;
  }
}

/**
 * Observable value primitive
 */
export class Observable<T> {
  private value: T;
  private listeners = new Set<(value: T, oldValue: T) => void>();
  
  constructor(initialValue: T) {
    this.value = initialValue;
  }
  
  get(): T {
    return this.value;
  }
  
  set(newValue: T): void {
    if (this.value !== newValue) {
      const oldValue = this.value;
      this.value = newValue;
      this.notify(newValue, oldValue);
    }
  }
  
  update(updater: (value: T) => T): void {
    this.set(updater(this.value));
  }
  
  subscribe(listener: (value: T, oldValue: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(value: T, oldValue: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(value, oldValue);
      } catch (error) {
        console.error('Error in observable listener:', error);
      }
    });
  }
}

/**
 * Async queue primitive
 */
export class AsyncQueue<T> {
  private queue: T[] = [];
  private resolvers: ((value: T) => void)[] = [];
  
  push(item: T): void {
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver(item);
    } else {
      this.queue.push(item);
    }
  }
  
  async pop(): Promise<T> {
    const item = this.queue.shift();
    if (item !== undefined) {
      return item;
    }
    
    return new Promise<T>(resolve => {
      this.resolvers.push(resolve);
    });
  }
  
  size(): number {
    return this.queue.length;
  }
  
  clear(): void {
    this.queue = [];
    this.resolvers = [];
  }
}

/**
 * Deferred promise primitive
 */
export class Deferred<T> {
  public promise: Promise<T>;
  public resolve!: (value: T) => void;
  public reject!: (reason?: any) => void;
  private settled = false;
  
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = (value: T) => {
        if (!this.settled) {
          this.settled = true;
          resolve(value);
        }
      };
      
      this.reject = (reason?: any) => {
        if (!this.settled) {
          this.settled = true;
          reject(reason);
        }
      };
    });
  }
  
  isSettled(): boolean {
    return this.settled;
  }
}

/**
 * Cache primitive with TTL support
 */
export class Cache<K, V> {
  private cache = new Map<K, { value: V; expires?: number }>();
  private timers = new Map<K, any>();
  
  constructor(private defaultTTL?: number) {}
  
  set(key: K, value: V, ttl?: number): void {
    // Clear existing timer
    this.clearTimer(key);
    
    const expires = ttl || this.defaultTTL;
    if (expires) {
      const expiryTime = Date.now() + expires;
      this.cache.set(key, { value, expires: expiryTime });
      
      // Set new timer
      const timer = setTimeout(() => {
        this.delete(key);
      }, expires);
      
      this.timers.set(key, timer);
    } else {
      this.cache.set(key, { value });
    }
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: K): boolean {
    this.clearTimer(key);
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }
  
  size(): number {
    // Clean expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expires && now > entry.expires) {
        this.delete(key);
      }
    }
    
    return this.cache.size;
  }
  
  private clearTimer(key: K): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}

/**
 * Object pool primitive for reusable objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  
  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    private maxSize = 100
  ) {}
  
  acquire(): T {
    const obj = this.pool.pop();
    return obj || this.factory();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
  
  clear(): void {
    this.pool = [];
  }
  
  size(): number {
    return this.pool.length;
  }
}

/**
 * Simple state machine primitive
 */
export class StateMachine<S extends string, E extends string> {
  private currentState: S;
  private transitions = new Map<string, S>();
  private listeners = new EventEmitter<{ transition: [S, S, E] }>();
  
  constructor(
    initialState: S,
    transitions: Array<{ from: S; event: E; to: S }>
  ) {
    this.currentState = initialState;
    
    // Build transition map
    transitions.forEach(({ from, event, to }) => {
      this.transitions.set(`${from}:${event}`, to);
    });
  }
  
  getState(): S {
    return this.currentState;
  }
  
  canTransition(event: E): boolean {
    const key = `${this.currentState}:${event}`;
    return this.transitions.has(key);
  }
  
  transition(event: E): boolean {
    const key = `${this.currentState}:${event}`;
    const nextState = this.transitions.get(key);
    
    if (!nextState) {
      return false;
    }
    
    const prevState = this.currentState;
    this.currentState = nextState;
    this.listeners.emit('transition', prevState, nextState, event);
    
    return true;
  }
  
  onTransition(
    listener: (from: S, to: S, event: E) => void
  ): () => void {
    return this.listeners.on('transition', listener);
  }
}

// Export all primitives
export const primitives = {
  EventEmitter,
  Observable,
  AsyncQueue,
  Deferred,
  Cache,
  ObjectPool,
  StateMachine
};