/**
 * In-memory cache implementation
 */

import type { CacheOptions, CacheEntry } from '../types.js';

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;
  private maxSize: number;
  
  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 0; // 0 = no expiration
    this.maxSize = options.maxSize || 1000;
  }
  
  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check expiration
    if (entry.expires > 0 && Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove oldest entry (FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    const now = Date.now();
    const expires = (ttl || this.ttl) > 0 ? now + (ttl || this.ttl) : 0;
    
    this.cache.set(key, {
      value,
      expires,
      created: now
    });
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  /**
   * Delete a key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires > 0 && now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}