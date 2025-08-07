/**
 * BRUTAL V4 - Cache Manager
 * Unified caching system with L1/L2/L3 support
 * Memory, IndexedDB, and Service Worker integration
 */

import { PolyfillStrategy } from '../base/PolyfillStrategy.js';
import { globalEventBus } from '../events/EventBus.js';

// Cache stores
const cacheStores = new Map();

export class CacheManager {
    constructor(options = {}) {
        this.name = options.name || 'brutal-cache';
        this.maxSize = options.maxSize || 100;
        this.ttl = options.ttl || 300000; // 5 minutes default
        
        // L1 - Memory cache
        this.l1 = new Map();
        this.l1Stats = { hits: 0, misses: 0, evictions: 0 };
        
        // L2 - IndexedDB (if available)
        this.l2 = null;
        this.l2Available = false;
        this._initL2();
        
        // L3 - Service Worker (if available)
        this.l3 = null;
        this.l3Available = false;
        this._initL3();
        
        // Track access times for LRU
        this.accessTimes = new Map();
        
        // Register instance
        cacheStores.set(this.name, this);
    }

    /**
     * Get value from cache
     */
    async get(key) {
        // Check L1
        if (this.l1.has(key)) {
            const entry = this.l1.get(key);
            if (this._isValid(entry)) {
                this.l1Stats.hits++;
                this._updateAccess(key);
                globalEventBus.emit('cache:hit', { level: 'L1', key });
                return entry.value;
            } else {
                this.l1.delete(key);
                this.accessTimes.delete(key);
            }
        }
        
        this.l1Stats.misses++;

        // Check L2
        if (this.l2Available) {
            const value = await this._getFromL2(key);
            if (value !== undefined) {
                // Promote to L1
                this._setL1(key, value);
                globalEventBus.emit('cache:hit', { level: 'L2', key });
                return value;
            }
        }

        // Check L3
        if (this.l3Available) {
            const value = await this._getFromL3(key);
            if (value !== undefined) {
                // Promote to L1 and L2
                this._setL1(key, value);
                if (this.l2Available) {
                    await this._setL2(key, value);
                }
                globalEventBus.emit('cache:hit', { level: 'L3', key });
                return value;
            }
        }

        globalEventBus.emit('cache:miss', { key });
        return undefined;
    }

    /**
     * Set value in cache
     */
    async set(key, value, options = {}) {
        const ttl = options.ttl || this.ttl;
        const priority = options.priority || 'normal';

        // Set in L1
        this._setL1(key, value, ttl);

        // Set in L2
        if (this.l2Available && priority !== 'low') {
            await this._setL2(key, value, ttl);
        }

        // Set in L3
        if (this.l3Available && priority === 'high') {
            await this._setL3(key, value, ttl);
        }

        globalEventBus.emit('cache:set', { key, levels: this._getLevels(priority) });
    }

    /**
     * Delete from cache
     */
    async delete(key) {
        // Delete from all levels
        this.l1.delete(key);
        this.accessTimes.delete(key);

        if (this.l2Available) {
            await this._deleteFromL2(key);
        }

        if (this.l3Available) {
            await this._deleteFromL3(key);
        }

        globalEventBus.emit('cache:delete', { key });
    }

    /**
     * Clear entire cache
     */
    async clear() {
        this.l1.clear();
        this.accessTimes.clear();
        this.l1Stats = { hits: 0, misses: 0, evictions: 0 };

        if (this.l2Available) {
            await this._clearL2();
        }

        if (this.l3Available) {
            await this._clearL3();
        }

        globalEventBus.emit('cache:clear', { name: this.name });
    }

    /**
     * Check if key exists
     */
    has(key) {
        if (this.l1.has(key)) {
            const entry = this.l1.get(key);
            return this._isValid(entry);
        }
        return false;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            name: this.name,
            size: this.l1.size,
            maxSize: this.maxSize,
            l1Stats: { ...this.l1Stats },
            l2Available: this.l2Available,
            l3Available: this.l3Available,
            hitRate: this.l1Stats.hits / (this.l1Stats.hits + this.l1Stats.misses) || 0
        };
    }

    /**
     * Set L1 cache value
     */
    _setL1(key, value, ttl = this.ttl) {
        // Evict if needed
        if (this.l1.size >= this.maxSize) {
            this._evictLRU();
        }

        this.l1.set(key, {
            value,
            expires: Date.now() + ttl,
            size: this._estimateSize(value)
        });

        this._updateAccess(key);
    }

    /**
     * Check if cache entry is valid
     */
    _isValid(entry) {
        return entry && entry.expires > Date.now();
    }

    /**
     * Update access time for LRU
     */
    _updateAccess(key) {
        this.accessTimes.set(key, Date.now());
    }

    /**
     * Evict least recently used
     */
    _evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.l1.delete(oldestKey);
            this.accessTimes.delete(oldestKey);
            this.l1Stats.evictions++;
            globalEventBus.emit('cache:evict', { key: oldestKey });
        }
    }

    /**
     * Estimate size of value
     */
    _estimateSize(value) {
        if (typeof value === 'string') {
            return value.length * 2; // 2 bytes per char
        }
        return JSON.stringify(value).length * 2;
    }

    /**
     * Get cache levels for priority
     */
    _getLevels(priority) {
        switch (priority) {
            case 'high': return ['L1', 'L2', 'L3'];
            case 'normal': return ['L1', 'L2'];
            case 'low': return ['L1'];
            default: return ['L1'];
        }
    }

    /**
     * Initialize L2 (IndexedDB)
     */
    async _initL2() {
        if (typeof indexedDB === 'undefined') {
            return;
        }

        try {
            const request = indexedDB.open(`brutal-cache-${this.name}`, 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('cache')) {
                    const store = db.createObjectStore('cache', { keyPath: 'key' });
                    store.createIndex('expires', 'expires', { unique: false });
                }
            };

            this.l2 = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            this.l2Available = true;
        } catch (error) {
            console.warn('IndexedDB not available:', error);
        }
    }

    /**
     * Initialize L3 (Service Worker)
     */
    async _initL3() {
        if (!PolyfillStrategy.detect('serviceWorker')) {
            return;
        }

        try {
            // Check for cache API
            if ('caches' in window) {
                this.l3 = await caches.open(`brutal-${this.name}-v1`);
                this.l3Available = true;
                
                // Clean expired entries periodically
                this._scheduleL3Cleanup();
            }
        } catch (error) {
            console.warn('Cache API not available:', error);
        }
    }

    // L2 (IndexedDB) operations
    async _getFromL2(key) {
        if (!this.l2) return undefined;

        try {
            const transaction = this.l2.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);

            const result = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (result && result.expires && result.expires < Date.now()) {
                await this._deleteFromL2(key);
                return undefined;
            }

            return result ? result.value : undefined;
        } catch (error) {
            console.error('L2 get error:', error);
            return undefined;
        }
    }

    async _setL2(key, value, ttl) {
        if (!this.l2) return;

        try {
            const transaction = this.l2.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            const data = {
                key,
                value,
                expires: ttl ? Date.now() + ttl : null,
                timestamp: Date.now()
            };

            const request = store.put(data);

            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('L2 set error:', error);
        }
    }

    async _deleteFromL2(key) {
        if (!this.l2) return;

        try {
            const transaction = this.l2.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.delete(key);

            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('L2 delete error:', error);
        }
    }

    async _clearL2() {
        if (!this.l2) return;

        try {
            const transaction = this.l2.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.clear();

            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('L2 clear error:', error);
        }
    }

    // L3 (Service Worker) operations
    async _getFromL3(key) {
        if (!this.l3) return undefined;
        
        try {
            const response = await this.l3.match(this._l3Key(key));
            if (response) {
                const headers = response.headers;
                const expires = headers.get('x-brutal-expires');
                
                if (expires && parseInt(expires) < Date.now()) {
                    await this._deleteFromL3(key);
                    return undefined;
                }
                
                const data = await response.json();
                return data.value;
            }
        } catch (error) {
            console.error('L3 get error:', error);
        }
        return undefined;
    }

    async _setL3(key, value, ttl) {
        if (!this.l3) return;
        
        try {
            const data = {
                value,
                timestamp: Date.now()
            };
            
            const headers = new Headers({
                'Content-Type': 'application/json',
                'x-brutal-key': key,
                'x-brutal-timestamp': Date.now().toString()
            });
            
            if (ttl) {
                headers.set('x-brutal-expires', (Date.now() + ttl).toString());
            }
            
            const response = new Response(JSON.stringify(data), { headers });
            await this.l3.put(this._l3Key(key), response);
        } catch (error) {
            console.error('L3 set error:', error);
        }
    }

    async _deleteFromL3(key) {
        if (!this.l3) return;
        
        try {
            await this.l3.delete(this._l3Key(key));
        } catch (error) {
            console.error('L3 delete error:', error);
        }
    }

    async _clearL3() {
        if (!this.l3) return;
        
        try {
            const keys = await this.l3.keys();
            await Promise.all(keys.map(request => this.l3.delete(request)));
        } catch (error) {
            console.error('L3 clear error:', error);
        }
    }

    /**
     * Generate L3 cache key
     */
    _l3Key(key) {
        return new Request(`https://brutal-cache/${this.name}/${key}`);
    }

    /**
     * Schedule periodic L3 cleanup
     */
    _scheduleL3Cleanup() {
        if (this._l3CleanupTimer) return;
        
        this._l3CleanupTimer = setInterval(async () => {
            if (!this.l3) return;
            
            try {
                const keys = await this.l3.keys();
                const now = Date.now();
                
                for (const request of keys) {
                    const response = await this.l3.match(request);
                    if (response) {
                        const expires = response.headers.get('x-brutal-expires');
                        if (expires && parseInt(expires) < now) {
                            await this.l3.delete(request);
                        }
                    }
                }
            } catch (error) {
                console.error('L3 cleanup error:', error);
            }
        }, 60000); // Clean every minute
    }
}

// Export singleton default cache
export const defaultCache = new CacheManager({ name: 'brutal-default' });

// Get or create cache
export function getCache(name) {
    if (!cacheStores.has(name)) {
        cacheStores.set(name, new CacheManager({ name }));
    }
    return cacheStores.get(name);
}