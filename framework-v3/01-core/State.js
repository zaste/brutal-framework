/**
 * BRUTAL Framework V3 - State Management
 * SharedArrayBuffer support, Atomic operations, Zero dependencies
 */

import { BRUTAL_EVENTS, emitBrutalEvent } from './events.js';

export class State {
  constructor(initialState = {}, options = {}) {
    // Configuration
    this.name = options.name || 'default';
    this.maxSize = options.maxSize || 1024 * 1024; // 1MB default
    this.persistence = options.persistence || false;
    
    // Check for SharedArrayBuffer support
    this.useSharedMemory = typeof SharedArrayBuffer !== 'undefined' 
      && typeof Atomics !== 'undefined'
      && crossOriginIsolated;
    
    // Float64 conversion buffers for atomic operations
    if (this.useSharedMemory) {
      this._float64Buffer = new ArrayBuffer(8);
      this._float64View = new Float64Array(this._float64Buffer);
      this._uint32View = new Uint32Array(this._float64Buffer);
    }
    
    // Initialize state storage
    if (this.useSharedMemory && options.shared) {
      this._initSharedMemory();
    } else {
      this._initRegularState(initialState);
    }
    
    // Subscribers
    this.listeners = new Map();
    this.computedCache = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = options.maxHistory || 50;
    
    // Performance tracking
    this._metrics = {
      updates: 0,
      notifications: 0,
      avgUpdateTime: 0
    };
    
    // Worker for heavy computations
    this.worker = null;
    
    // Load persisted state if enabled
    if (this.persistence) {
      this._loadPersistedState();
    }
  }
  
  /**
   * Initialize shared memory state
   */
  _initSharedMemory() {
    // Allocate shared buffer
    this.buffer = new SharedArrayBuffer(this.maxSize);
    
    // Different views for different data types
    this.int32View = new Int32Array(this.buffer);
    this.float64View = new Float64Array(this.buffer);
    this.uint8View = new Uint8Array(this.buffer);
    
    // Lock for synchronization
    this.lockBuffer = new SharedArrayBuffer(4);
    this.lock = new Int32Array(this.lockBuffer);
    
    // Metadata for key-index mapping
    this.keyMap = new Map();
    this.nextIndex = 0;
    
    // State proxy for seamless API
    this.state = new Proxy({}, {
      get: (target, prop) => this._sharedGet(prop),
      set: (target, prop, value) => this._sharedSet(prop, value),
      has: (target, prop) => this.keyMap.has(prop),
      deleteProperty: (target, prop) => this._sharedDelete(prop)
    });
  }
  
  /**
   * Initialize regular state
   */
  _initRegularState(initialState) {
    // Create reactive proxy
    this.state = new Proxy(initialState, {
      get: (target, prop) => {
        // Track computed dependencies
        if (this._trackingComputed) {
          this._currentDeps.add(prop);
        }
        return target[prop];
      },
      set: (target, prop, value) => {
        const oldValue = target[prop];
        if (oldValue === value) return true;
        
        target[prop] = value;
        this._notifyChange(prop, value, oldValue);
        return true;
      },
      deleteProperty: (target, prop) => {
        const oldValue = target[prop];
        delete target[prop];
        this._notifyChange(prop, undefined, oldValue);
        return true;
      }
    });
  }
  
  /**
   * Get value from shared memory
   */
  _sharedGet(key) {
    if (!this.keyMap.has(key)) return undefined;
    
    const { index, type } = this.keyMap.get(key);
    
    // Atomic read
    switch (type) {
      case 'int32':
        return Atomics.load(this.int32View, index);
      case 'float64':
        // Use type punning for atomic float64 access
        const uint32Index = index * 2;
        const low = Atomics.load(this.uint32View, uint32Index);
        const high = Atomics.load(this.uint32View, uint32Index + 1);
        
        // Convert back to float64
        this._uint32View[0] = low;
        this._uint32View[1] = high;
        return this._float64View[0];
      case 'boolean':
        return Boolean(Atomics.load(this.uint8View, index));
      default:
        // Complex types need serialization
        return this._deserialize(index);
    }
  }
  
  /**
   * Set value in shared memory
   */
  _sharedSet(key, value) {
    const start = performance.now();
    
    // Acquire lock with timeout
    const LOCK_TIMEOUT = 5000; // 5 seconds
    const lockStart = Date.now();
    
    while (Atomics.compareExchange(this.lock, 0, 0, 1) !== 0) {
      if (Date.now() - lockStart > LOCK_TIMEOUT) {
        throw new Error('Lock acquisition timeout - possible deadlock');
      }
      Atomics.wait(this.lock, 0, 1, 10); // 10ms timeout
    }
    
    try {
      let index, type;
      
      if (this.keyMap.has(key)) {
        ({ index, type } = this.keyMap.get(key));
      } else {
        // Allocate new slot
        index = this.nextIndex++;
        type = this._getType(value);
        this.keyMap.set(key, { index, type });
      }
      
      // Atomic write
      const oldValue = this._sharedGet(key);
      
      switch (type) {
        case 'int32':
          Atomics.store(this.int32View, index, value);
          break;
        case 'float64':
          // Use type punning for atomic float64 access
          this._float64View[0] = value;
          const uint32Index = index * 2;
          Atomics.store(this.uint32View, uint32Index, this._uint32View[0]);
          Atomics.store(this.uint32View, uint32Index + 1, this._uint32View[1]);
          break;
        case 'boolean':
          Atomics.store(this.uint8View, index, value ? 1 : 0);
          break;
        default:
          // Complex types need serialization
          this._serialize(index, value);
      }
      
      // Notify all waiting threads
      Atomics.notify(this.lock, 0);
      
      // Track change
      this._notifyChange(key, value, oldValue);
      
    } finally {
      // Release lock
      Atomics.store(this.lock, 0, 0);
    }
    
    // Update metrics
    const updateTime = performance.now() - start;
    this._updateMetrics(updateTime);
    
    return true;
  }
  
  /**
   * Delete from shared memory
   */
  _sharedDelete(key) {
    if (!this.keyMap.has(key)) return true;
    
    const oldValue = this._sharedGet(key);
    this.keyMap.delete(key);
    this._notifyChange(key, undefined, oldValue);
    
    return true;
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(path, callback, options = {}) {
    const id = Symbol('listener');
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }
    
    this.listeners.get(path).set(id, {
      callback,
      immediate: options.immediate,
      deep: options.deep
    });
    
    // Call immediately if requested
    if (options.immediate) {
      const value = this.get(path);
      callback(value, undefined, path);
    }
    
    // Return unsubscribe function
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(id);
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }
  
  /**
   * Get value by path
   */
  get(path) {
    if (!path) return this.state;
    
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value;
  }
  
  /**
   * Set value by path
   */
  set(path, value) {
    if (!path) {
      Object.assign(this.state, value);
      return;
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let target = this.state;
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
  }
  
  /**
   * Batch updates
   */
  batch(updateFn) {
    this._batching = true;
    const changes = [];
    
    // Collect changes
    const originalNotify = this._notifyChange;
    this._notifyChange = (path, newValue, oldValue) => {
      changes.push({ path, newValue, oldValue });
    };
    
    try {
      updateFn(this.state);
    } finally {
      // Restore and notify
      this._notifyChange = originalNotify;
      this._batching = false;
      
      // Notify all changes at once
      for (const change of changes) {
        this._notifyChange(change.path, change.newValue, change.oldValue);
      }
    }
  }
  
  /**
   * Create computed value
   */
  computed(key, computeFn) {
    // Track dependencies
    this._trackingComputed = true;
    this._currentDeps = new Set();
    
    const value = computeFn(this.state);
    
    this._trackingComputed = false;
    
    // Store computed info
    this.computedCache.set(key, {
      value,
      computeFn,
      deps: this._currentDeps
    });
    
    // Subscribe to dependencies
    for (const dep of this._currentDeps) {
      this.subscribe(dep, () => {
        const computed = this.computedCache.get(key);
        if (computed) {
          const newValue = computeFn(this.state);
          computed.value = newValue;
          this._notifyChange(`computed.${key}`, newValue, computed.value);
        }
      });
    }
    
    return value;
  }
  
  /**
   * Time travel - undo
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const snapshot = this.history[this.historyIndex];
      this._restoreSnapshot(snapshot);
    }
  }
  
  /**
   * Time travel - redo
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const snapshot = this.history[this.historyIndex];
      this._restoreSnapshot(snapshot);
    }
  }
  
  /**
   * Notify listeners of change
   */
  _notifyChange(path, newValue, oldValue) {
    if (this._batching) return;
    
    this._metrics.notifications++;
    
    // Add to history
    if (!this._restoringSnapshot) {
      this._addToHistory();
    }
    
    // Notify direct listeners
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      for (const { callback } of pathListeners.values()) {
        callback(newValue, oldValue, path);
      }
    }
    
    // Notify parent path listeners (deep watchers)
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      const parentListeners = this.listeners.get(parentPath);
      
      if (parentListeners) {
        for (const { callback, deep } of parentListeners.values()) {
          if (deep) {
            callback(this.get(parentPath), undefined, parentPath);
          }
        }
      }
    }
    
    // Emit global change event
    if (window.__BRUTAL__?.debug) {
      emitBrutalEvent(window, BRUTAL_EVENTS.STATE_CHANGE, {
        path, 
        newValue, 
        oldValue, 
        store: this.name
      });
    }
  }
  
  /**
   * Add current state to history
   */
  _addToHistory() {
    // Remove future history if we've undone
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add new snapshot
    const snapshot = this._createSnapshot();
    this.history.push(snapshot);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  /**
   * Create state snapshot
   */
  _createSnapshot() {
    if (this.useSharedMemory) {
      // Snapshot shared memory
      return {
        keyMap: new Map(this.keyMap),
        int32: new Int32Array(this.int32View),
        float64: new Float64Array(this.float64View),
        uint8: new Uint8Array(this.uint8View)
      };
    } else {
      // Deep clone regular state
      return JSON.parse(JSON.stringify(this.state));
    }
  }
  
  /**
   * Restore from snapshot
   */
  _restoreSnapshot(snapshot) {
    this._restoringSnapshot = true;
    
    if (this.useSharedMemory) {
      this.keyMap = new Map(snapshot.keyMap);
      this.int32View.set(snapshot.int32);
      this.float64View.set(snapshot.float64);
      this.uint8View.set(snapshot.uint8);
    } else {
      Object.keys(this.state).forEach(key => delete this.state[key]);
      Object.assign(this.state, snapshot);
    }
    
    this._restoringSnapshot = false;
    this._notifyChange('*', this.state, null);
  }
  
  /**
   * Persist state to storage
   */
  persist() {
    if (!this.persistence) return;
    
    const data = this._createSnapshot();
    const key = `brutal-state-${this.name}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      }
  }
  
  /**
   * Load persisted state
   */
  _loadPersistedState() {
    const key = `brutal-state-${this.name}`;
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const snapshot = JSON.parse(data);
        this._restoreSnapshot(snapshot);
      }
    } catch (error) {
      }
  }
  
  /**
   * Update performance metrics
   */
  _updateMetrics(updateTime) {
    this._metrics.updates++;
    this._metrics.avgUpdateTime = 
      (this._metrics.avgUpdateTime * (this._metrics.updates - 1) + updateTime) 
      / this._metrics.updates;
  }
  
  /**
   * Get type for shared memory allocation
   */
  _getType(value) {
    if (Number.isInteger(value)) return 'int32';
    if (typeof value === 'number') return 'float64';
    if (typeof value === 'boolean') return 'boolean';
    return 'complex';
  }
  
  /**
   * Serialize complex types to SharedArrayBuffer
   */
  _serialize(index, value) {
    // Enhanced serialization using MessagePack-like encoding
    if (!this.complexData) {
      this.complexData = new Map();
      this.textEncoder = new TextEncoder();
      this.textDecoder = new TextDecoder();
    }
    
    // For now, use JSON with compression potential
    const serialized = JSON.stringify(value);
    const encoded = this.textEncoder.encode(serialized);
    
    // Store in a Uint8Array that could be in SharedArrayBuffer
    this.complexData.set(index, {
      buffer: encoded,
      length: encoded.length,
      type: 'json'
    });
    
    // Store a marker and length in the main buffer
    this.int32View[index] = -1; // Marker for complex type
    if (index + 1 < this.int32View.length) {
      this.int32View[index + 1] = encoded.length; // Store length
    }
  }
  
  /**
   * Deserialize complex types from SharedArrayBuffer
   */
  _deserialize(index) {
    // Check if it's a complex type marker
    if (this.int32View[index] === -1 && this.complexData) {
      const data = this.complexData.get(index);
      if (data) {
        try {
          if (!this.textDecoder) {
            this.textDecoder = new TextDecoder();
          }
          
          const decoded = this.textDecoder.decode(data.buffer);
          return JSON.parse(decoded);
        } catch (error) {
          return undefined;
        }
      }
    }
    return undefined;
  }
  
  /**
   * Allocate space for complex types in SharedArrayBuffer
   * This would be used for true zero-copy serialization
   */
  _allocateComplexSpace(size) {
    // Reserve space in the main buffer for complex data
    const COMPLEX_BUFFER_START = 10000; // Reserve first 10k indices for simple types
    
    if (!this.complexAllocationIndex) {
      this.complexAllocationIndex = COMPLEX_BUFFER_START;
    }
    
    const start = this.complexAllocationIndex;
    this.complexAllocationIndex += Math.ceil(size / 4); // int32 slots needed
    
    return start;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this._metrics };
  }
  
  /**
   * Clear all state
   */
  clear() {
    if (this.useSharedMemory) {
      this.keyMap.clear();
      this.nextIndex = 0;
      // Clear buffers
      this.int32View.fill(0);
      this.float64View.fill(0);
      this.uint8View.fill(0);
    } else {
      Object.keys(this.state).forEach(key => delete this.state[key]);
    }
    
    this._notifyChange('*', {}, this.state);
  }
  
  /**
   * Destroy state manager
   */
  destroy() {
    this.listeners.clear();
    this.computedCache.clear();
    this.history = [];
    
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// Global state registry
export const stateRegistry = new Map();

/**
 * Create or get state instance
 */
export function createState(name, initialState, options) {
  if (stateRegistry.has(name)) {
    return stateRegistry.get(name);
  }
  
  const state = new State(initialState, { ...options, name });
  stateRegistry.set(name, state);
  
  return state;
}

/**
 * Get existing state instance
 */
export function getState(name = 'default') {
  return stateRegistry.get(name);
}

/**
 * Clear all states
 */
export function clearAllStates() {
  for (const state of stateRegistry.values()) {
    state.destroy();
  }
  stateRegistry.clear();
}