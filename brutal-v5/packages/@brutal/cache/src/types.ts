/**
 * Public types for @brutal/cache
 */

export interface ExampleOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface ExampleResult {
  /** Operation success */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error if failed */
  error?: Error;
}

export type ExampleCallback = (result: ExampleResult) => void;

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum number of entries */
  maxSize?: number;
  /** Storage type for persistence */
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheEntry<T = any> {
  value: T;
  expires: number;
  created: number;
}
