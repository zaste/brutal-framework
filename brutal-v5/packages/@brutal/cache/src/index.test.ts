import { jest } from '@jest/globals';
import { MemoryCache, StorageCache, createCache, PACKAGE_NAME, VERSION } from './index';

describe('@brutal/cache', () => {
  it('should export all public APIs', () => {
    expect(MemoryCache).toBeDefined();
    expect(StorageCache).toBeDefined();
    expect(createCache).toBeDefined();
    expect(PACKAGE_NAME).toBe('@brutal/cache');
    expect(VERSION).toBeDefined();
  });
  
  it('should create memory cache by default', () => {
    const cache = createCache();
    expect(cache).toBeInstanceOf(MemoryCache);
  });
  
  it('should create storage cache when specified', () => {
    // Mock localStorage
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true
    });
    
    const cache = createCache({ storage: 'localStorage' });
    expect(cache).toBeInstanceOf(StorageCache);
  });
});