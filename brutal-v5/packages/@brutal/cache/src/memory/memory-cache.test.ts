import { MemoryCache } from './memory-cache';

describe('@brutal/cache - MemoryCache', () => {
  let cache: MemoryCache<string>;
  
  beforeEach(() => {
    cache = new MemoryCache();
  });
  
  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
    
    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });
    
    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });
    
    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });
    
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });
  
  describe('TTL', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });
    
    it('should use default TTL', async () => {
      const cacheWithTTL = new MemoryCache({ ttl: 100 });
      cacheWithTTL.set('key1', 'value1');
      expect(cacheWithTTL.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheWithTTL.get('key1')).toBeUndefined();
    });
  });
  
  describe('size limits', () => {
    it('should respect maxSize', () => {
      const smallCache = new MemoryCache({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict key1
      
      expect(smallCache.size).toBe(2);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
    });
  });
  
  describe('cleanup', () => {
    it('should clean expired entries', async () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2'); // No expiration
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      cache.cleanup();
      expect(cache.size).toBe(1);
      expect(cache.has('key2')).toBe(true);
    });
  });
  
  describe('keys', () => {
    it('should return all cache keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
    
    it('should return empty array when cache is empty', () => {
      expect(cache.keys()).toEqual([]);
    });
  });
});