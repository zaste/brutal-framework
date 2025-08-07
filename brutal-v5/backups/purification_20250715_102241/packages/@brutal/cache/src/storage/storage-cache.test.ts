import { jest } from '@jest/globals';
import { StorageCache } from './storage-cache';

// Mock Storage
class MockStorage implements Storage {
  private data: Map<string, string> = new Map();
  
  get length() { return this.data.size; }
  
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] || null;
  }
  
  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  removeItem(key: string): void {
    this.data.delete(key);
  }
  
  clear(): void {
    this.data.clear();
  }
}

describe('@brutal/cache - StorageCache', () => {
  let originalLocalStorage: Storage;
  let originalSessionStorage: Storage;
  
  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    originalSessionStorage = global.sessionStorage;
    Object.defineProperty(global, 'localStorage', {
      value: new MockStorage(),
      writable: true
    });
    Object.defineProperty(global, 'sessionStorage', {
      value: new MockStorage(),
      writable: true
    });
  });
  
  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    Object.defineProperty(global, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true
    });
  });
  
  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      const cache = new StorageCache<string>();
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
    
    it('should return undefined for missing keys', () => {
      const cache = new StorageCache();
      expect(cache.get('missing')).toBeUndefined();
    });
    
    it('should check if key exists', () => {
      const cache = new StorageCache();
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });
    
    it('should delete keys', () => {
      const cache = new StorageCache();
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });
    
    it('should clear all entries', () => {
      const cache = new StorageCache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });
  
  describe('TTL', () => {
    it('should expire entries after TTL', async () => {
      const cache = new StorageCache({ ttl: 100 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });
  });
  
  describe('serialization', () => {
    it('should handle complex objects', () => {
      const cache = new StorageCache<any>();
      const obj = { name: 'test', data: [1, 2, 3] };
      
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });
  });
  
  describe('storage options', () => {
    it('should use sessionStorage when specified', () => {
      const cache = new StorageCache({ storage: 'sessionStorage' });
      cache.set('key1', 'value1');
      
      expect(sessionStorage.getItem('brutal-cache:key1')).toBeTruthy();
      expect(localStorage.getItem('brutal-cache:key1')).toBeNull();
    });
  });
  
  describe('error handling', () => {
    it('should handle JSON parse errors in get', () => {
      const cache = new StorageCache<string>();
      localStorage.setItem('brutal-cache:bad', 'invalid json');
      
      expect(cache.get('bad')).toBeUndefined();
    });
    
    it('should handle storage errors in delete', () => {
      const cache = new StorageCache<string>();
      
      // Mock removeItem to throw
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = () => { throw new Error('Storage error'); };
      
      expect(cache.delete('key')).toBe(false);
      
      // Restore
      localStorage.removeItem = originalRemoveItem;
    });
  });
  
  describe('size management', () => {
    it('should respect max size limit', () => {
      const cache = new StorageCache<string>({ maxSize: 2 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Should evict oldest when adding new
      cache.set('key3', 'value3');
      
      expect(cache.size).toBe(2);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });
    
    it('should not evict when updating existing key at max size', () => {
      const cache = new StorageCache<string>({ maxSize: 2 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Update existing key - should not evict
      cache.set('key2', 'updated');
      
      expect(cache.size).toBe(2);
      expect(cache.has('key1')).toBe(true);
      expect(cache.get('key2')).toBe('updated');
    });
  });
  
  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const cache = new StorageCache<string>({ ttl: 50 });
      
      cache.set('expire1', 'value1');
      cache.set('keep', 'value2', 200);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      cache.cleanup();
      
      expect(cache.has('expire1')).toBe(false);
      expect(cache.has('keep')).toBe(true);
    });
  });
  
  describe('getOldestKey', () => {
    it('should return null for empty cache', () => {
      const cache = new StorageCache<string>();
      expect((cache as any).getOldestKey()).toBeNull();
    });
    
    it('should handle invalid entries', () => {
      const cache = new StorageCache<string>();
      
      // Add valid entry
      cache.set('valid', 'value');
      
      // Add invalid entry directly
      localStorage.setItem('brutal-cache:invalid', 'not json');
      
      // Should still find valid entry
      expect((cache as any).getOldestKey()).toBe('valid');
    });
  });
  
  describe('keys method', () => {
    it('should return only cache keys', () => {
      const cache = new StorageCache<string>();
      
      // Add cache entries
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Add non-cache entry
      localStorage.setItem('other:key', 'value');
      
      const keys = cache.keys();
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });
  
  describe('quota exceeded handling', () => {
    it('should retry after cleanup on DOMException', () => {
      const cache = new StorageCache<string>();
      
      // Add some entries
      cache.set('old1', 'value1');
      cache.set('old2', 'value2');
      
      let callCount = 0;
      const originalSetItem = localStorage.setItem;
      
      // Mock to throw DOMException on first call
      localStorage.setItem = function(key: string, value: string) {
        callCount++;
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
      
      // Should succeed on retry
      cache.set('new', 'value');
      expect(cache.get('new')).toBe('value');
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
    
    it('should handle non-DOMException errors', () => {
      const cache = new StorageCache<string>();
      
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('Other error'); };
      
      // Should not throw
      expect(() => cache.set('key', 'value')).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
    
    it('should handle failed retry after cleanup', () => {
      const cache = new StorageCache<string>();
      
      const originalSetItem = localStorage.setItem;
      
      // Always throw DOMException
      localStorage.setItem = () => { throw new DOMException('QuotaExceededError'); };
      
      // Should not throw
      expect(() => cache.set('key', 'value')).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
    
    it('should use correct TTL in retry after quota exceeded', () => {
      const cache = new StorageCache<string>({ ttl: 5000 });
      
      const originalSetItem = localStorage.setItem;
      let callCount = 0;
      let savedData: any;
      
      // Throw on first call, succeed on second
      localStorage.setItem = jest.fn((key, value) => {
        callCount++;
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError');
        }
        savedData = JSON.parse(value);
      });
      
      // Set with custom TTL
      cache.set('key', 'value', 10000);
      
      // Should have retried with correct TTL
      expect(callCount).toBe(2);
      expect(savedData.expires).toBeGreaterThan(Date.now() + 9000);
      expect(savedData.expires).toBeLessThan(Date.now() + 11000);
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
    
    it('should use default TTL when no TTL provided in retry', () => {
      const cache = new StorageCache<string>({ ttl: 3000 });
      
      const originalSetItem = localStorage.setItem;
      let callCount = 0;
      let savedData: any;
      
      // Throw on first call, succeed on second
      localStorage.setItem = jest.fn((key, value) => {
        callCount++;
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError');
        }
        savedData = JSON.parse(value);
      });
      
      // Set without custom TTL
      cache.set('key', 'value');
      
      // Should have retried with default TTL
      expect(callCount).toBe(2);
      expect(savedData.expires).toBeGreaterThan(Date.now() + 2000);
      expect(savedData.expires).toBeLessThan(Date.now() + 4000);
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});