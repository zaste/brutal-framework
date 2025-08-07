/**
 * BRUTAL V4 - Weak Cache Implementation
 * Memory-safe caching using WeakMap
 */

export class BrutalWeakCache {
    constructor() {
        this._cache = new WeakMap();
        this._refs = new Map();
    }
    
    set(key, value) {
        if (typeof key !== 'object' || key === null) {
            throw new TypeError('WeakCache key must be an object');
        }
        
        this._cache.set(key, value);
        
        // Keep weak reference if available
        if (typeof WeakRef !== 'undefined') {
            this._refs.set(key, new WeakRef(value));
        }
    }
    
    get(key) {
        return this._cache.get(key);
    }
    
    has(key) {
        return this._cache.has(key);
    }
    
    delete(key) {
        this._refs.delete(key);
        return this._cache.delete(key);
    }
}