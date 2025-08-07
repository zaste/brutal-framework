/**
 * Core types for @brutal/foundation
 */

// Configuration types
export interface FoundationConfig {
  /** Enable debug mode */
  debug?: boolean;
  /** Environment name */
  environment?: 'development' | 'production' | 'test';
  /** Custom configuration values */
  [key: string]: unknown;
}

// Package registry types
export interface PackageInfo {
  name: string;
  version: string;
  loaded: boolean;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

// Polyfill types
export interface PolyfillConfig {
  /** Feature to polyfill */
  feature: string;
  /** Test function to check if polyfill is needed */
  test: () => boolean;
  /** Polyfill loader function */
  load: () => Promise<void>;
  /** Priority (higher loads first) */
  priority?: number;
}

// Environment types
export interface EnvironmentProfile {
  name: string;
  debug: boolean;
  minify: boolean;
  sourceMaps: boolean;
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

// Config loader types
export interface ConfigOptions {
  /** Config file path */
  path?: string;
  /** Environment override */
  environment?: string;
  /** Merge with defaults */
  mergeDefaults?: boolean;
}

// Error types
export interface ErrorInfo {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
  stack?: string;
}

// Debug types
export interface DebugInfo {
  enabled: boolean;
  namespace?: string;
  level?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;
export type Fn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;
export type AsyncFn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

// Object types
export type PlainObject = Record<string, unknown>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
