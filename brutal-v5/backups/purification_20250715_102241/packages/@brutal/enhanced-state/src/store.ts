/**
 * Enhanced state store with all features integrated
 */

import { createStore, type Store } from '@brutal/state';
// Simple event emitter inline to reduce bundle
import { StateHistory } from './time-travel/index.js';
import { StatePersister, type PersistenceAdapter } from './persistence/index.js';
import { computed, type ComputedProperty, globalTracker, Computed } from './computed/index.js';
import { StateInspector } from './devtools/index.js';
// Removed middleware - too heavy for bundle size

export interface EnhancedStoreOptions<T> {
  /** Enable time-travel debugging */
  timeTravel?: boolean | { maxSnapshots?: number };
  /** Enable persistence */
  persistence?: {
    key: string;
    adapter: PersistenceAdapter;
    version?: number;
  };
  /** Enable DevTools */
  devTools?: boolean | { name?: string };
}

export interface EnhancedStore<T> extends Store<T> {
  /** Time-travel API */
  history: StateHistory<T>;
  /** Persistence API */
  persist(): Promise<void>;
  hydrate(): Promise<void>;
  /** Computed properties */
  computed<R>(computation: () => R): ComputedProperty<R>;
  /** DevTools API */
  inspector: StateInspector<T>;
}

export function createEnhancedStore<T>(
  initialState: T,
  options: EnhancedStoreOptions<T> = {}
): EnhancedStore<T> {
  // Create base store
  const baseStore = createStore(initialState);
  const changeListeners = new Set<(event: any) => void>();
  
  // Initialize features
  const history = new StateHistory<T>(
    typeof options.timeTravel === 'object' 
      ? options.timeTravel 
      : undefined
  );
  
  const persister = options.persistence 
    ? new StatePersister<T>(options.persistence.adapter, {
        version: options.persistence.version
      })
    : null;
  
  const inspector = new StateInspector<T>(
    typeof options.devTools === 'object' 
      ? options.devTools 
      : undefined
  );
  
  
  // Track computed properties for invalidation
  const computedProperties = new Set<Computed<any>>();

  // Track state access for computed properties
  const trackedGetState = (): T => {
    const state = baseStore.getState();
    
    // Track access if in computed context
    if (globalTracker.isTracking()) {
      globalTracker.track('*'); // Track full state access
    }
    
    return state;
  };

  // Enhanced setState with features
  const enhancedSetState = (
    newState: Partial<T>, 
    action?: { type: string; payload?: unknown }
  ): void => {
    const prevState = baseStore.getState();
    baseStore.setState(newState);
    const nextState = baseStore.getState();

    // Update history
    if (options.timeTravel) {
      history.snapshot(nextState, action);
    }

    // Log to DevTools
    if (options.devTools) {
      inspector.logStateChange({
        prevState,
        nextState,
        action,
        timestamp: Date.now()
      });
    }

    // Emit change event
    changeListeners.forEach(listener => listener({ prevState, nextState, action }));
    
    // Invalidate all computed properties
    computedProperties.forEach(computed => computed.invalidate());
  };

  // Create enhanced store
  const enhancedStore: EnhancedStore<T> = {
    getState: trackedGetState,
    
    setState: (newState: Partial<T>) => {
      enhancedSetState(newState);
    },
    
    subscribe: (listener: (state: T) => void) => {
      // Subscribe to base store and change events
      const unsubBase = baseStore.subscribe(listener);
      const changeListener = (event: any) => listener(event.nextState);
      changeListeners.add(changeListener);
      
      return () => {
        unsubBase();
        changeListeners.delete(changeListener);
      };
    },
    
    history,
    
    persist: async () => {
      if (!persister || !options.persistence) {
        throw new Error('Persistence not configured');
      }
      await persister.persist(options.persistence.key, baseStore.getState());
    },
    
    hydrate: async () => {
      if (!persister || !options.persistence) {
        throw new Error('Persistence not configured');
      }
      const state = await persister.hydrate(options.persistence.key);
      if (state) {
        baseStore.setState(state);
      }
    },
    
    computed: <R>(computation: () => R) => {
      const computedProp = computed(computation);
      // Track this computed property
      computedProperties.add(computedProp);
      return computedProp;
    },
    
    use: (middleware: Middleware<T>) => pipeline.use(middleware),
    
    inspector
  };

  // Take initial snapshot
  if (options.timeTravel) {
    history.snapshot(initialState);
  }

  return enhancedStore;
}