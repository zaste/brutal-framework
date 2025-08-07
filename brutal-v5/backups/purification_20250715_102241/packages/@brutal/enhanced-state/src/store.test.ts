import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createEnhancedStore } from './store.js';
import { MemoryAdapter } from './persistence/index.js';

describe('createEnhancedStore', () => {
  interface TestState {
    count: number;
    name: string;
  }

  let initialState: TestState;

  beforeEach(() => {
    initialState = { count: 0, name: 'test' };
  });

  describe('basic functionality', () => {
    it('should create store with initial state', () => {
      const store = createEnhancedStore(initialState);
      expect(store.getState()).toEqual(initialState);
    });

    it('should update state', () => {
      const store = createEnhancedStore(initialState);
      store.setState({ count: 1 });
      expect(store.getState()).toEqual({ count: 1, name: 'test' });
    });

    it('should subscribe to changes', () => {
      const store = createEnhancedStore(initialState);
      const listener = jest.fn();
      
      store.subscribe(listener);
      store.setState({ count: 1 });
      
      expect(listener).toHaveBeenCalledWith({ count: 1, name: 'test' });
    });
  });

  describe('time-travel', () => {
    it('should enable time-travel when configured', () => {
      const store = createEnhancedStore(initialState, { timeTravel: true });
      
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      
      expect(store.history.getHistory()).toHaveLength(3); // initial + 2 updates
      expect(store.history.canUndo()).toBe(true);
    });

    it('should disable time-travel by default', () => {
      const store = createEnhancedStore(initialState);
      store.setState({ count: 1 });
      
      expect(store.history.getHistory()).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist state when configured', async () => {
      const adapter = new MemoryAdapter();
      const store = createEnhancedStore(initialState, {
        persistence: { key: 'test', adapter }
      });
      
      store.setState({ count: 5 });
      await store.persist();
      
      const stored = await adapter.get('brutal-state:test');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored as string).data).toEqual({ count: 5, name: 'test' });
    });

    it('should hydrate state from storage', async () => {
      const adapter = new MemoryAdapter();
      await adapter.set('brutal-state:test', JSON.stringify({
        data: { count: 10, name: 'hydrated' },
        version: 1,
        timestamp: Date.now()
      }));
      
      const store = createEnhancedStore(initialState, {
        persistence: { key: 'test', adapter }
      });
      
      await store.hydrate();
      expect(store.getState()).toEqual({ count: 10, name: 'hydrated' });
    });

    it('should throw when persistence not configured', async () => {
      const store = createEnhancedStore(initialState);
      await expect(store.persist()).rejects.toThrow('Persistence not configured');
    });
  });

  describe('computed properties', () => {
    it('should create computed properties', () => {
      const store = createEnhancedStore(initialState);
      const doubleCount = store.computed(() => store.getState().count * 2);
      
      expect(doubleCount.get()).toBe(0);
      
      store.setState({ count: 5 });
      expect(doubleCount.get()).toBe(10);
    });
  });

  describe('middleware', () => {
    it('should execute middleware', () => {
      const middlewareFn = jest.fn((context, next) => next());
      const store = createEnhancedStore(initialState, {
        middleware: [middlewareFn]
      });
      
      store.setState({ count: 1 });
      
      expect(middlewareFn).toHaveBeenCalled();
    });

    it('should add middleware dynamically', () => {
      const store = createEnhancedStore(initialState);
      const middlewareFn = jest.fn((context, next) => next());
      
      store.use(middlewareFn);
      store.setState({ count: 1 });
      
      expect(middlewareFn).toHaveBeenCalled();
    });
  });

  describe('devtools', () => {
    it('should enable devtools when configured', () => {
      const store = createEnhancedStore(initialState, { devTools: true });
      
      store.setState({ count: 1 });
      
      const history = store.inspector.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].prevState).toEqual(initialState);
      expect(history[0].nextState).toEqual({ count: 1, name: 'test' });
    });

    it('should expose to window when in browser', () => {
      (global as any).window = {};
      
      const store = createEnhancedStore(initialState, {
        devTools: { name: 'TestStore' }
      });
      
      expect((global as any).window.__BRUTAL_STATE_DEVTOOLS__).toBeDefined();
      expect((global as any).window.__BRUTAL_STATE_DEVTOOLS__.TestStore).toBe(store.inspector);
      
      delete (global as any).window;
    });
  });
});