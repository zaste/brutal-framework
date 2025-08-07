/**
 * Type definitions for @brutal/events
 */

/**
 * Generic event handler function
 */
export type EventHandler<T = any> = (data: T, event?: string | symbol) => void | Promise<void>;

/**
 * Wildcard event handler
 */
export type WildcardHandler<T extends EventMap = EventMap> = <K extends keyof T>(
  data: T[K],
  event: K
) => void | Promise<void>;

/**
 * Event map interface
 */
export interface EventMap {
  [event: string]: any;
}

/**
 * Event listener options
 */
export interface ListenerOptions {
  once?: boolean;
  prepend?: boolean;
  signal?: AbortSignal;
}

/**
 * Event target interface
 */
export interface EventTarget<T extends EventMap = EventMap> {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  off<K extends keyof T>(event: K, handler?: EventHandler<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

/**
 * DOM event options
 */
export interface DOMEventOptions extends AddEventListenerOptions {
  selector?: string;
  throttle?: number;
  debounce?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Custom event definition
 */
export interface CustomEventDefinition<T = any> {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
  detail?: T;
}

/**
 * Event bus message
 */
export interface EventBusMessage<T = any> {
  id: string;
  timestamp: number;
  event: string;
  data: T;
  source?: string;
  target?: string;
}

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe(): void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
}

/**
 * Event filter
 */
export type EventFilter<T = any> = (data: T, event: string | symbol) => boolean;

/**
 * Event transformer
 */
export type EventTransformer<T = any, U = any> = (data: T, event: string | symbol) => U;

/**
 * Event middleware
 */
export type EventMiddleware<T extends EventMap = EventMap> = (
  event: keyof T,
  data: T[keyof T],
  next: () => void
) => void | Promise<void>;

/**
 * Event channel for cross-context communication
 */
export interface EventChannel<T extends EventMap = EventMap> {
  send<K extends keyof T>(event: K, data: T[K]): void;
  receive<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  close(): void;
}

/**
 * Event replay options
 */
export interface ReplayOptions {
  speed?: number;
  filter?: EventFilter;
  transform?: EventTransformer;
}

/**
 * Event metrics
 */
export interface EventMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageHandlerTime: number;
  slowestHandler: string;
  busiestEvent: string;
}

/**
 * Common event types
 */
export interface CommonEvents {
  error: Error;
  ready: void;
  close: void;
  data: any;
  message: any;
  connect: void;
  disconnect: void;
}