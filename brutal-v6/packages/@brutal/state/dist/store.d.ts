/**
 * Create reactive stores with zero boilerplate
 */
import { Store, StoreConfig } from './types';
/**
 * Creates a reactive store from config object
 * Actions are functions, everything else is state
 */
export declare function createStore<T extends StoreConfig>(config: T): Store<T>;
//# sourceMappingURL=store.d.ts.map