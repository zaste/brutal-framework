import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WebStorageAdapter } from './web-storage.js';

// Mock Storage implementation for testing
class MockStorage implements Storage {
  private data = new Map<string, string>();
  
  get length(): number {
    return this.data.size;
  }
  
  clear(): void {
    this.data.clear();
  }
  
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  removeItem(key: string): void {
    this.data.delete(key);
  }
  
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

describe('WebStorageAdapter', () => {
  let mockStorage: MockStorage;
  let adapter: WebStorageAdapter;

  beforeEach(() => {
    mockStorage = new MockStorage();
    adapter = new WebStorageAdapter(mockStorage);
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('get', () => {
    it('should retrieve stored value', async () => {
      mockStorage.setItem('test', JSON.stringify({ value: 'data' }));
      const result = await adapter.get('test');
      expect(result).toEqual({ value: 'data' });
    });

    it('should return null for non-existent key', async () => {
      const result = await adapter.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      mockStorage.setItem('test', 'invalid json');
      const result = await adapter.get('test');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value as JSON', async () => {
      await adapter.set('test', { value: 'data' });
      const stored = mockStorage.getItem('test');
      expect(stored).toBe('{"value":"data"}');
    });

    it('should handle storage quota exceeded', async () => {
      // Mock quota exceeded error
      mockStorage.setItem = () => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      };

      await expect(adapter.set('test', { value: 'data' }))
        .rejects.toThrow('Storage quota exceeded');
    });
  });

  describe('remove', () => {
    it('should remove stored item', async () => {
      mockStorage.setItem('test', 'value');
      await adapter.remove('test');
      expect(mockStorage.getItem('test')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all items', async () => {
      mockStorage.setItem('test1', 'value1');
      mockStorage.setItem('test2', 'value2');
      await adapter.clear();
      expect(mockStorage.length).toBe(0);
    });
  });
});