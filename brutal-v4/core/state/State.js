/**
 * BRUTAL V4 - Native State Management
 * Pure native Proxy-based reactive state system
 * Zero dependencies, optimized for performance
 */

import { PolyfillStrategy } from '../base/PolyfillStrategy.js';

/**
 * BrutalState - Reactive state management using native Proxy
 * 
 * Features:
 * - Native Proxy-based reactivity
 * - Event-driven updates
 * - Deep state observation
 * - Performance optimizations
 * - Memory-efficient
 * - Type-safe getters/setters
 */
export class BrutalState extends EventTarget {
    constructor(initialState = {}) {
        super();
        
        // Internal state storage
        this._rawState = { ...initialState };
        this._subscriptions = new Set();
        this._isUpdating = false;
        this._batchedUpdates = new Map();
        this._batchTimeout = null;
        
        // Performance tracking
        this._updateCount = 0;
        this._lastUpdate = 0;
        
        // Create reactive proxy
        this._state = this._createProxy(this._rawState);
        
        // Batch configuration
        this._batchDelay = 0; // Synchronous by default
        this._enableBatching = false;
    }
    
    /**
     * Create reactive proxy for state object
     */
    _createProxy(target, path = []) {
        return new Proxy(target, {
            get: (obj, prop) => {
                const value = obj[prop];
                
                // Return nested proxy for objects
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return this._createProxy(value, [...path, prop]);
                }
                
                return value;
            },
            
            set: (obj, prop, value) => {
                const oldValue = obj[prop];
                const fullPath = [...path, prop];
                
                // Set the value
                obj[prop] = value;
                
                // Notify of change
                this._notifyChange(fullPath, value, oldValue);
                
                return true;
            },
            
            deleteProperty: (obj, prop) => {
                const oldValue = obj[prop];
                const fullPath = [...path, prop];
                
                delete obj[prop];
                
                // Notify of deletion
                this._notifyChange(fullPath, undefined, oldValue);
                
                return true;
            }
        });
    }
    
    /**
     * Notify state change
     */
    _notifyChange(path, value, oldValue) {
        if (this._isUpdating) {
            return; // Prevent infinite loops
        }
        
        const key = path.join('.');
        
        if (this._enableBatching) {
            // Batch the update
            this._batchedUpdates.set(key, { path, value, oldValue });
            this._scheduleBatchedUpdate();
        } else {
            // Immediate update
            this._emitChange(key, path, value, oldValue);
        }
    }
    
    /**
     * Schedule batched update
     */
    _scheduleBatchedUpdate() {
        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
        }
        
        this._batchTimeout = setTimeout(() => {
            this._flushBatchedUpdates();
        }, this._batchDelay);
    }
    
    /**
     * Flush batched updates
     */
    _flushBatchedUpdates() {
        if (this._batchedUpdates.size === 0) {
            return;
        }
        
        const updates = Array.from(this._batchedUpdates.values());
        this._batchedUpdates.clear();
        
        // Emit batch change event
        this.dispatchEvent(new CustomEvent('batch-change', {
            detail: { updates }
        }));
        
        // Emit individual change events
        for (const update of updates) {
            this._emitChange(
                update.path.join('.'),
                update.path,
                update.value,
                update.oldValue
            );
        }
    }
    
    /**
     * Emit change event
     */
    _emitChange(key, path, value, oldValue) {
        const startTime = performance.now();
        
        // Update metrics
        this._updateCount++;
        
        // Create change event
        const changeEvent = new CustomEvent('change', {
            detail: {
                key,
                path,
                value,
                oldValue,
                state: this._rawState
            }
        });
        
        // Dispatch event
        this.dispatchEvent(changeEvent);
        
        // Create specific property event
        const propEvent = new CustomEvent(`change:${key}`, {
            detail: { value, oldValue, path }
        });
        
        this.dispatchEvent(propEvent);
        
        // Update performance metrics
        this._lastUpdate = performance.now() - startTime;
    }
    
    /**
     * Get state value by key
     */
    get(key) {
        if (key === undefined) {
            return this._state;
        }
        
        const path = key.split('.');
        let value = this._state;
        
        for (const prop of path) {
            if (value && typeof value === 'object') {
                value = value[prop];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Set state values
     */
    set(updates) {
        this._isUpdating = true;
        
        try {
            for (const [key, value] of Object.entries(updates)) {
                this._setByPath(key, value);
            }
        } finally {
            this._isUpdating = false;
        }
        
        // Force batched update if enabled
        if (this._enableBatching && this._batchedUpdates.size > 0) {
            this._flushBatchedUpdates();
        }
    }
    
    /**
     * Set value by path
     */
    _setByPath(key, value) {
        const path = key.split('.');
        let current = this._state;
        
        // Navigate to parent object
        for (let i = 0; i < path.length - 1; i++) {
            const prop = path[i];
            if (!(prop in current) || typeof current[prop] !== 'object') {
                current[prop] = {};
            }
            current = current[prop];
        }
        
        // Set final property
        const finalProp = path[path.length - 1];
        current[finalProp] = value;
    }
    
    /**
     * Update state with function
     */
    update(updater) {
        this._isUpdating = true;
        
        try {
            updater(this._state);
        } finally {
            this._isUpdating = false;
        }
        
        // Force batched update if enabled
        if (this._enableBatching && this._batchedUpdates.size > 0) {
            this._flushBatchedUpdates();
        }
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(callback, options = {}) {
        const wrappedCallback = (event) => {
            if (options.key && !event.type.endsWith(`:${options.key}`)) {
                return; // Skip if not matching key
            }
            callback(event.detail, event);
        };
        
        const eventType = options.key ? `change:${options.key}` : 'change';
        this.addEventListener(eventType, wrappedCallback);
        
        // Return unsubscribe function
        return () => {
            this.removeEventListener(eventType, wrappedCallback);
        };
    }
    
    /**
     * Subscribe to batch changes
     */
    subscribeToBatch(callback) {
        this.addEventListener('batch-change', callback);
        return () => this.removeEventListener('batch-change', callback);
    }
    
    /**
     * Reset state to initial values
     */
    reset(newState = {}) {
        this._isUpdating = true;
        
        try {
            // Clear current state
            for (const key of Object.keys(this._rawState)) {
                delete this._rawState[key];
            }
            
            // Set new state
            Object.assign(this._rawState, newState);
            
            // Recreate proxy
            this._state = this._createProxy(this._rawState);
            
        } finally {
            this._isUpdating = false;
        }
        
        // Emit reset event
        this.dispatchEvent(new CustomEvent('reset', {
            detail: { state: this._rawState }
        }));
    }
    
    /**
     * Get snapshot of current state
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this._rawState));
    }
    
    /**
     * Check if key exists in state
     */
    has(key) {
        const value = this.get(key);
        return value !== undefined;
    }
    
    /**
     * Delete key from state
     */
    delete(key) {
        const path = key.split('.');
        let current = this._state;
        
        // Navigate to parent
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
            if (!current || typeof current !== 'object') {
                return false; // Path doesn't exist
            }
        }
        
        // Delete final property
        const finalProp = path[path.length - 1];
        return delete current[finalProp];
    }
    
    /**
     * Get all keys in state
     */
    keys() {
        return Object.keys(this._rawState);
    }
    
    /**
     * Configure batching
     */
    setBatching(enabled, delay = 0) {
        this._enableBatching = enabled;
        this._batchDelay = delay;
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            updateCount: this._updateCount,
            lastUpdateTime: this._lastUpdate,
            batchedUpdates: this._batchedUpdates.size,
            subscriptions: this._subscriptions.size
        };
    }
    
    /**
     * Create computed value
     */
    computed(getter, dependencies = []) {
        let cachedValue;
        let isDirty = true;
        
        const updateCache = () => {
            cachedValue = getter(this._state);
            isDirty = false;
        };
        
        // Subscribe to dependencies
        const unsubscribers = dependencies.map(dep => 
            this.subscribe(() => {
                isDirty = true;
            }, { key: dep })
        );
        
        // Return computed object
        return {
            get value() {
                if (isDirty) {
                    updateCache();
                }
                return cachedValue;
            },
            destroy() {
                unsubscribers.forEach(unsub => unsub());
            }
        };
    }
    
    /**
     * Cleanup method for memory management
     */
    cleanup() {
        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
        }
        this._subscriptions.clear();
    }
}

/**
 * Create a new state instance
 */
export function createState(initialState = {}) {
    return new BrutalState(initialState);
}

/**
 * State utilities
 */
export const StateUtils = {
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    },
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Get nested value safely
     */
    get(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        
        return result;
    }
};