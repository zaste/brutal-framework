/**
 * State persister with versioning and migration support
 */

import type { PersistenceAdapter, PersistenceOptions, PersistedState } from './types.js';

export class StatePersister<T> {
  private adapter: PersistenceAdapter;
  private options: Required<PersistenceOptions>;

  constructor(adapter: PersistenceAdapter, options: PersistenceOptions = {}) {
    this.adapter = adapter;
    this.options = {
      prefix: options.prefix ?? 'brutal-state',
      serialize: options.serialize ?? JSON.stringify,
      deserialize: options.deserialize ?? JSON.parse,
      version: options.version ?? 1,
      migrate: options.migrate ?? ((state) => state)
    };
  }

  private getKey(key: string): string {
    return `${this.options.prefix}:${key}`;
  }

  async persist(key: string, state: T): Promise<void> {
    const persisted: PersistedState<T> = {
      data: state,
      version: this.options.version,
      timestamp: Date.now()
    };

    const serialized = this.options.serialize(persisted);
    await this.adapter.set(this.getKey(key), serialized);
  }

  async hydrate(key: string): Promise<T | null> {
    const stored = await this.adapter.get<string>(this.getKey(key));
    if (!stored) return null;

    try {
      const persisted = this.options.deserialize<PersistedState<any>>(stored);
      
      // Handle version mismatch
      if (persisted.version !== this.options.version) {
        const migrated = this.options.migrate(persisted.data, persisted.version);
        // Save migrated version
        await this.persist(key, migrated);
        return migrated;
      }

      return persisted.data;
    } catch {
      // Invalid stored data
      await this.adapter.remove(this.getKey(key));
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await this.adapter.remove(this.getKey(key));
  }

  async clear(): Promise<void> {
    // Only clear keys with our prefix
    if (this.adapter instanceof Map || 'keys' in this.adapter) {
      // For adapters that support listing keys
      const keys = await (this.adapter as any).keys();
      for (const key of keys) {
        if (key.startsWith(this.options.prefix)) {
          await this.adapter.remove(key);
        }
      }
    } else {
      // Fallback: clear all (less precise)
      await this.adapter.clear();
    }
  }
}