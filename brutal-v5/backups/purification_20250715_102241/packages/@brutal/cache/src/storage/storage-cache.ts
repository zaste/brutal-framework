/**
 * Browser storage-based cache implementation
 */

import type { CacheOptions, CacheEntry } from '../types.js';

export class StorageCache<T = any> {
  private storage: Storage;
  private prefix: string;
  private ttl: number;
  private maxSize: number;
  
  constructor(options: CacheOptions = {}) {
    const storageType = options.storage || 'localStorage';
    this.storage = storageType === 'sessionStorage' ? sessionStorage : localStorage;
    this.prefix = 'brutal-cache:';
    this.ttl = options.ttl || 0;
    this.maxSize = options.maxSize || 100;
  }
  
  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return undefined;
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check expiration
      if (entry.expires > 0 && Date.now() > entry.expires) {
        this.delete(key);
        return undefined;
      }
      
      return entry.value;
    } catch {
      return undefined;
    }
  }
  
  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    try {
      // Check size limit
      if (this.size >= this.maxSize && !this.has(key)) {
        // Remove oldest entry
        const oldestKey = this.getOldestKey();
        if (oldestKey) {
          this.delete(oldestKey);
        }
      }
      
      const now = Date.now();
      const expires = (ttl || this.ttl) > 0 ? now + (ttl || this.ttl) : 0;
      
      const entry: CacheEntry<T> = {
        value,
        expires,
        created: now
      };
      
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      // Storage quota exceeded
      if (e instanceof DOMException) {
        // Clear some space and retry
        this.cleanup();
        try {
          this.storage.setItem(this.prefix + key, JSON.stringify({
            value,
            expires: (ttl || this.ttl) > 0 ? Date.now() + (ttl || this.ttl) : 0,
            created: Date.now()
          }));
        } catch {
          // Still failed, give up
        }
      }
    }
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
    try {
      this.storage.removeItem(this.prefix + key);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    const keys = this.keys();
    keys.forEach(key => {
      this.storage.removeItem(this.prefix + key);
    });
  }
  
  /**
   * Get cache size
   */
  get size(): number {
    return this.keys().length;
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }
  
  /**
   * Clean expired entries
   */
  cleanup(): void {
    const keys = this.keys();
    
    keys.forEach(key => {
      this.get(key); // Will auto-delete if expired
    });
  }
  
  /**
   * Get oldest key
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    const keys = this.keys();
    
    for (const key of keys) {
      try {
        const item = this.storage.getItem(this.prefix + key);
        if (item) {
          const entry: CacheEntry = JSON.parse(item);
          if (entry.created < oldestTime) {
            oldestTime = entry.created;
            oldestKey = key;
          }
        }
      } catch {
        // Invalid entry, skip
      }
    }
    
    return oldestKey;
  }
}