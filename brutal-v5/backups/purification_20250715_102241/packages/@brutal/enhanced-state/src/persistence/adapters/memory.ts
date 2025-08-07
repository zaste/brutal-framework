/**
 * In-memory adapter for state persistence (useful for testing)
 */

import type { PersistenceAdapter } from '../types.js';

export class MemoryAdapter implements PersistenceAdapter {
  private storage = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.storage.get(key) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}