import { createCache } from './cache-factory';
import { MemoryCache } from '../memory/memory-cache';
import { StorageCache } from '../storage/storage-cache';

describe('@brutal/cache - Factory', () => {
  describe('createCache', () => {
    it('should create memory cache by default', () => {
      const cache = createCache();
      expect(cache).toBeInstanceOf(MemoryCache);
    });
    
    it('should create memory cache when specified', () => {
      const cache = createCache({ storage: 'memory' });
      expect(cache).toBeInstanceOf(MemoryCache);
    });
    
    it('should create localStorage cache when specified', () => {
      const cache = createCache({ storage: 'localStorage' });
      expect(cache).toBeInstanceOf(StorageCache);
    });
    
    it('should create sessionStorage cache when specified', () => {
      const cache = createCache({ storage: 'sessionStorage' });
      expect(cache).toBeInstanceOf(StorageCache);
    });
    
    it('should pass options to cache', () => {
      const cache = createCache<number>({ 
        ttl: 5000,
        maxSize: 50
      });
      
      cache.set('test', 42);
      expect(cache.get('test')).toBe(42);
    });
  });
});