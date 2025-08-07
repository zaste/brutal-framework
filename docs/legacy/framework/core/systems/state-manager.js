/**
 * 🔄 PHASE III - NATIVE STATE MANAGEMENT SYSTEM
 * Reactive state management for Native Web Components
 * 
 * Performance Target: Sub-millisecond state updates
 * Architecture: Observable state with dependency tracking
 */

/**
 * 🎯 REACTIVE STATE STORE
 * Central state management with performance optimization
 */
class NativeStateStore {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._subscribers = new Map();
    this._computedProperties = new Map();
    this._stateHistory = [];
    this._maxHistorySize = 50;
    
    // Performance tracking
    this._updateCount = 0;
    this._performanceMetrics = {
      updates: [],
      subscriptions: [],
      computations: []
    };
    
    // Create reactive proxy
    this._reactiveState = this._createReactiveProxy();
  }
  
  /**
   * 🔧 Create reactive proxy for state observation
   */
  _createReactiveProxy() {
    return new Proxy(this._state, {
      get: (target, key) => {
        // Track access for computed properties
        this._trackAccess(key);
        return target[key];
      },
      
      set: (target, key, value) => {
        const startTime = performance.now();
        const oldValue = target[key];
        
        // Only update if value changed
        if (oldValue === value) return true;
        
        // Update state
        target[key] = value;
        
        // Add to history
        this._addToHistory(key, value, oldValue);
        
        // Notify subscribers
        this._notifySubscribers(key, value, oldValue);
        
        // Update computed properties
        this._updateComputedProperties(key);
        
        // Performance tracking
        const updateTime = performance.now() - startTime;
        this._performanceMetrics.updates.push({
          key,
          time: updateTime,
          timestamp: Date.now()
        });
        
        this._updateCount++;
        
        return true;
      }
    });
  }
  
  /**
   * 📊 Get current state
   */
  getState() {
    return { ...this._state };
  }
  
  /**
   * 🔄 Update state with batch operations
   */
  setState(updates) {
    const startTime = performance.now();
    
    // Batch updates to minimize re-renders
    const keys = Object.keys(updates);
    const oldValues = {};
    
    // Collect old values
    keys.forEach(key => {
      oldValues[key] = this._state[key];
    });
    
    // Apply all updates
    Object.assign(this._state, updates);
    
    // Notify subscribers for all changes
    keys.forEach(key => {
      if (oldValues[key] !== updates[key]) {
        this._notifySubscribers(key, updates[key], oldValues[key]);
      }
    });
    
    // Update computed properties
    this._updateAllComputedProperties();
    
    // Performance tracking
    const updateTime = performance.now() - startTime;
    this._performanceMetrics.updates.push({
      type: 'batch',
      keys,
      time: updateTime,
      timestamp: Date.now()
    });
    
    return this;
  }
  
  /**
   * 👁️ Subscribe to state changes
   */
  subscribe(keyOrCallback, callback) {
    const startTime = performance.now();
    
    let key, cb;
    
    if (typeof keyOrCallback === 'function') {
      // Global subscriber
      key = '*';
      cb = keyOrCallback;
    } else {
      // Specific key subscriber
      key = keyOrCallback;
      cb = callback;
    }
    
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    
    this._subscribers.get(key).add(cb);
    
    // Performance tracking
    const subscriptionTime = performance.now() - startTime;
    this._performanceMetrics.subscriptions.push({
      key,
      time: subscriptionTime,
      timestamp: Date.now()
    });
    
    // Return unsubscribe function
    return () => {
      this._subscribers.get(key)?.delete(cb);
      if (this._subscribers.get(key)?.size === 0) {
        this._subscribers.delete(key);
      }
    };
  }
  
  /**
   * 🔔 Notify subscribers of state changes
   */
  _notifySubscribers(key, newValue, oldValue) {
    // Notify specific key subscribers
    this._subscribers.get(key)?.forEach(callback => {
      try {
        callback(newValue, oldValue, key);
      } catch (error) {
        console.error(`[NativeStateStore] Subscriber error for key "${key}":`, error);
      }
    });
    
    // Notify global subscribers
    this._subscribers.get('*')?.forEach(callback => {
      try {
        callback({ [key]: newValue }, { [key]: oldValue }, key);
      } catch (error) {
        console.error(`[NativeStateStore] Global subscriber error:`, error);
      }
    });
  }
  
  /**
   * 🧮 Create computed property
   */
  computed(name, computation) {
    const startTime = performance.now();
    
    this._computedProperties.set(name, {
      computation,
      dependencies: new Set(),
      value: undefined,
      lastUpdated: 0
    });
    
    // Initial computation
    this._updateComputedProperty(name);
    
    // Performance tracking
    const computationTime = performance.now() - startTime;
    this._performanceMetrics.computations.push({
      name,
      type: 'create',
      time: computationTime,
      timestamp: Date.now()
    });
    
    return this;
  }
  
  /**
   * 📊 Update specific computed property
   */
  _updateComputedProperty(name) {
    const computed = this._computedProperties.get(name);
    if (!computed) return;
    
    const startTime = performance.now();
    
    try {
      // Track dependencies during computation
      this._currentComputed = name;
      const newValue = computed.computation(this._reactiveState);
      this._currentComputed = null;
      
      computed.value = newValue;
      computed.lastUpdated = Date.now();
      
      // Performance tracking
      const computationTime = performance.now() - startTime;
      this._performanceMetrics.computations.push({
        name,
        type: 'update',
        time: computationTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`[NativeStateStore] Computed property error for "${name}":`, error);
    }
  }
  
  /**
   * 🔍 Track state access for dependency tracking
   */
  _trackAccess(key) {
    if (this._currentComputed) {
      const computed = this._computedProperties.get(this._currentComputed);
      if (computed) {
        computed.dependencies.add(key);
      }
    }
  }
  
  /**
   * 🔄 Update computed properties when dependencies change
   */
  _updateComputedProperties(changedKey) {
    this._computedProperties.forEach((computed, name) => {
      if (computed.dependencies.has(changedKey)) {
        this._updateComputedProperty(name);
      }
    });
  }
  
  /**
   * 🔄 Update all computed properties
   */
  _updateAllComputedProperties() {
    this._computedProperties.forEach((computed, name) => {
      this._updateComputedProperty(name);
    });
  }
  
  /**
   * 📜 Add state change to history
   */
  _addToHistory(key, newValue, oldValue) {
    this._stateHistory.push({
      key,
      newValue,
      oldValue,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this._stateHistory.length > this._maxHistorySize) {
      this._stateHistory.shift();
    }
  }
  
  /**
   * ⏪ Undo last state change
   */
  undo() {
    if (this._stateHistory.length === 0) return false;
    
    const lastChange = this._stateHistory.pop();
    this._state[lastChange.key] = lastChange.oldValue;
    
    // Notify subscribers
    this._notifySubscribers(lastChange.key, lastChange.oldValue, lastChange.newValue);
    
    return true;
  }
  
  /**
   * 📊 Get performance metrics
   */
  getPerformanceMetrics() {
    const avgUpdateTime = this._performanceMetrics.updates.length > 0 
      ? this._performanceMetrics.updates.reduce((sum, u) => sum + u.time, 0) / this._performanceMetrics.updates.length
      : 0;
    
    return {
      updateCount: this._updateCount,
      subscriberCount: Array.from(this._subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      computedCount: this._computedProperties.size,
      averageUpdateTime: avgUpdateTime,
      historySize: this._stateHistory.length,
      performance: this._performanceMetrics
    };
  }
  
  /**
   * 🧹 Clear performance metrics
   */
  clearMetrics() {
    this._performanceMetrics = {
      updates: [],
      subscriptions: [],
      computations: []
    };
  }
}

/**
 * 🎯 COMPONENT STATE MIXIN
 * Reactive state management for individual components
 */
class ComponentStateMixin {
  constructor() {
    this._localState = new NativeStateStore();
    this._stateSubscriptions = new Set();
  }
  
  /**
   * 🔄 Set component state
   */
  setState(updates) {
    return this._localState.setState(updates);
  }
  
  /**
   * 📊 Get component state
   */
  getState() {
    return this._localState.getState();
  }
  
  /**
   * 👁️ Watch state changes
   */
  watchState(key, callback) {
    const unsubscribe = this._localState.subscribe(key, callback);
    this._stateSubscriptions.add(unsubscribe);
    return unsubscribe;
  }
  
  /**
   * 🧮 Create computed state property
   */
  computedState(name, computation) {
    return this._localState.computed(name, computation);
  }
  
  /**
   * 🧹 Cleanup state subscriptions
   */
  _cleanupState() {
    this._stateSubscriptions.forEach(unsubscribe => unsubscribe());
    this._stateSubscriptions.clear();
  }
}

/**
 * 🌐 GLOBAL STATE MANAGER
 * Application-wide state management
 */
class GlobalStateManager {
  constructor() {
    this._stores = new Map();
    this._defaultStore = new NativeStateStore();
  }
  
  /**
   * 🏪 Create named store
   */
  createStore(name, initialState = {}) {
    const store = new NativeStateStore(initialState);
    this._stores.set(name, store);
    return store;
  }
  
  /**
   * 📊 Get store by name
   */
  getStore(name) {
    if (name) {
      return this._stores.get(name);
    }
    return this._defaultStore;
  }
  
  /**
   * 🗑️ Remove store
   */
  removeStore(name) {
    return this._stores.delete(name);
  }
  
  /**
   * 📋 List all stores
   */
  listStores() {
    return Array.from(this._stores.keys());
  }
  
  /**
   * 📊 Get global performance metrics
   */
  getGlobalMetrics() {
    const metrics = {
      storeCount: this._stores.size + 1, // +1 for default store
      stores: {}
    };
    
    // Default store metrics
    metrics.stores.default = this._defaultStore.getPerformanceMetrics();
    
    // Named store metrics
    this._stores.forEach((store, name) => {
      metrics.stores[name] = store.getPerformanceMetrics();
    });
    
    return metrics;
  }
}

// Global instance
const globalStateManager = new GlobalStateManager();

module.exports = {
  NativeStateStore,
  ComponentStateMixin,
  GlobalStateManager,
  globalStateManager
};