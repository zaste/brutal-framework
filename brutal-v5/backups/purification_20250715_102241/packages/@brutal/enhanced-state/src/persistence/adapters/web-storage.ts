/**
 * Generic Web Storage adapter for state persistence
 */

import type { PersistenceAdapter } from '../types.js';

export class WebStorageAdapter implements PersistenceAdapter {
  constructor(private storage: Storage) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}