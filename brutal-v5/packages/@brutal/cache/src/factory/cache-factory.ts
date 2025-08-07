/**
 * Cache factory
 */

import { MemoryCache } from '../memory/memory-cache.js';
import { StorageCache } from '../storage/storage-cache.js';
import type { CacheOptions } from '../types.js';

/**
 * Create a cache instance based on options
 */
export function createCache<T = any>(options: CacheOptions = {}) {
  const storage = options.storage || 'memory';
  
  if (storage === 'memory') {
    return new MemoryCache<T>(options);
  } else {
    return new StorageCache<T>(options);
  }
}