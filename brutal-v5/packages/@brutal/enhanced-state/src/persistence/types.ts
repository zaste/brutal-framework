/**
 * Types for state persistence
 */

export interface PersistenceAdapter {
  /** Get stored state */
  get<T>(key: string): Promise<T | null>;
  /** Store state */
  set<T>(key: string, value: T): Promise<void>;
  /** Remove stored state */
  remove(key: string): Promise<void>;
  /** Clear all stored states */
  clear(): Promise<void>;
}

export interface PersistenceOptions {
  /** Storage key prefix */
  prefix?: string;
  /** Serializer function */
  serialize?: <T>(value: T) => string;
  /** Deserializer function */
  deserialize?: <T>(value: string) => T;
  /** Version for migration support */
  version?: number;
  /** Migration function */
  migrate?: <T>(state: any, version: number) => T;
}

export interface PersistedState<T> {
  /** The actual state data */
  data: T;
  /** Version of the persisted state */
  version: number;
  /** Timestamp when state was persisted */
  timestamp: number;
}