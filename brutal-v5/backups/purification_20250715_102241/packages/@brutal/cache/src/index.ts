/**
 * @brutal/cache - Caching utilities
 * 
 * @packageDocumentation
 */

// Cache exports
export { MemoryCache } from './memory/memory-cache.js';
export { StorageCache } from './storage/storage-cache.js';
export { createCache } from './factory/cache-factory.js';
export type { CacheOptions, CacheEntry } from './types.js';

// Public API exports
export { ExampleFeature } from './example-feature/example-feature.js';
export type { ExampleOptions, ExampleResult } from './types.js';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/cache';
