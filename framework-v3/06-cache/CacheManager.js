/**
 * Cache Manager - Coordinates L1, L2, L3 caches
 * Unified API with intelligent routing
 */

import { L1Cache } from './L1Cache.js';
import { L2Cache } from './L2Cache.js';

export class CacheManager {
    constructor(config = {}) {
        this.config = {
            l1MaxSize: 50 * 1024 * 1024, // 50MB
            l2DbName: 'brutal-cache',
            enableServiceWorker: true,
            ...config
        };
        
        // Initialize cache layers
        this.l1 = new L1Cache(this.config.l1MaxSize);
        this.l2 = new L2Cache(this.config.l2DbName);
        this.l3Ready = false;
        
        // Stats
        this.stats = {
            l1Hits: 0,
            l2Hits: 0,
            l3Hits: 0,
            misses: 0,
            writes: 0
        };
        
        this.init();
    }

    async init() {
        // Initialize L3 (Service Worker)
        if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(
                    '/framework-v3/06-cache/service-worker.js'
                );
                this.l3Ready = registration.active !== null;
                } catch (error) {
                }
        }
    }

    async get(key, options = {}) {
        const { skipL1 = false, skipL2 = false, skipL3 = false } = options;
        
        // Try L1 (Memory)
        if (!skipL1) {
            const l1Value = this.l1.get(key);
            if (l1Value !== null) {
                this.stats.l1Hits++;
                return l1Value;
            }
        }
        
        // Try L2 (IndexedDB)
        if (!skipL2) {
            const l2Value = await this.l2.get(key);
            if (l2Value !== null) {
                this.stats.l2Hits++;
                
                // Promote to L1
                if (!skipL1) {
                    this.l1.set(key, l2Value);
                }
                
                return l2Value;
            }
        }
        
        // Try L3 (Service Worker) for URLs
        if (!skipL3 && this.l3Ready && this.isUrl(key)) {
            const response = await this.fetchFromServiceWorker(key);
            if (response) {
                this.stats.l3Hits++;
                const value = await response.json();
                
                // Promote to L1 and L2
                if (!skipL1) this.l1.set(key, value);
                if (!skipL2) await this.l2.set(key, value);
                
                return value;
            }
        }
        
        this.stats.misses++;
        return null;
    }

    async set(key, value, options = {}) {
        const {
            ttl = 3600000, // 1 hour default
            skipL1 = false,
            skipL2 = false,
            skipL3 = false,
            cacheOnly = [] // Array of cache levels to write to
        } = options;
        
        this.stats.writes++;
        
        const promises = [];
        
        // Write to specified caches or all by default
        const writeToL1 = cacheOnly.includes('l1') || (!cacheOnly.length && !skipL1);
        const writeToL2 = cacheOnly.includes('l2') || (!cacheOnly.length && !skipL2);
        const writeToL3 = cacheOnly.includes('l3') || (!cacheOnly.length && !skipL3);
        
        if (writeToL1) {
            this.l1.set(key, value, ttl);
        }
        
        if (writeToL2) {
            promises.push(this.l2.set(key, value, ttl));
        }
        
        if (writeToL3 && this.l3Ready && this.isUrl(key)) {
            promises.push(this.cacheInServiceWorker(key, value));
        }
        
        await Promise.all(promises);
        return true;
    }

    async delete(key) {
        const promises = [
            this.l1.delete(key),
            this.l2.delete(key)
        ];
        
        if (this.l3Ready && this.isUrl(key)) {
            promises.push(this.deleteFromServiceWorker(key));
        }
        
        await Promise.all(promises);
        return true;
    }

    async clear(options = {}) {
        const { levels = ['l1', 'l2', 'l3'] } = options;
        const promises = [];
        
        if (levels.includes('l1')) {
            this.l1.clear();
        }
        
        if (levels.includes('l2')) {
            promises.push(this.l2.clear());
        }
        
        if (levels.includes('l3') && this.l3Ready) {
            promises.push(this.clearServiceWorker());
        }
        
        await Promise.all(promises);
        
        // Reset stats
        this.stats = {
            l1Hits: 0,
            l2Hits: 0,
            l3Hits: 0,
            misses: 0,
            writes: 0
        };
        
        return true;
    }

    async getStats() {
        const l1Stats = this.l1.getStats();
        const l2Stats = await this.l2.getStats();
        
        const totalHits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits;
        const totalRequests = totalHits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
        
        return {
            overall: {
                ...this.stats,
                hitRate: hitRate.toFixed(2) + '%',
                totalRequests
            },
            l1: l1Stats,
            l2: l2Stats,
            l3: {
                ready: this.l3Ready,
                hits: this.stats.l3Hits
            }
        };
    }

    // Helper methods
    isUrl(key) {
        return typeof key === 'string' && (
            key.startsWith('http://') || 
            key.startsWith('https://') || 
            key.startsWith('/')
        );
    }

    async fetchFromServiceWorker(url) {
        try {
            return await fetch(url);
        } catch (error) {
            return null;
        }
    }

    async cacheInServiceWorker(url, data) {
        if (!navigator.serviceWorker.controller) return;
        
        return new Promise((resolve) => {
            const channel = new MessageChannel();
            
            channel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_URLS',
                payload: { urls: [url] }
            }, [channel.port2]);
        });
    }

    async deleteFromServiceWorker(url) {
        // Service Worker will handle cache invalidation
        return true;
    }

    async clearServiceWorker() {
        if (!navigator.serviceWorker.controller) return;
        
        return new Promise((resolve) => {
            const channel = new MessageChannel();
            
            channel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_CACHE'
            }, [channel.port2]);
        });
    }

    // Preload data into cache
    async preload(items) {
        const promises = items.map(({ key, value, options }) => 
            this.set(key, value, options)
        );
        
        await Promise.all(promises);
        return items.length;
    }

    // Cache warming
    async warm(urls) {
        if (!this.l3Ready) return 0;
        
        const promises = urls.map(url => fetch(url, { cache: 'force-cache' }));
        await Promise.all(promises);
        
        return urls.length;
    }

    destroy() {
        this.l1.destroy();
        this.l2.destroy();
    }
}

// Singleton instance
let instance = null;

export function getCacheManager(config) {
    if (!instance) {
        instance = new CacheManager(config);
    }
    return instance;
}