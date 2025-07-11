/**
 * L1 Memory Cache - Ultra-fast in-memory caching
 * LRU eviction with TTL support
 */

export class L1Cache {
    constructor(maxSize = 50 * 1024 * 1024) { // 50MB default
        this.cache = new Map();
        this.lru = new Map(); // Access order tracking
        this.size = 0;
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
    }

    set(key, value, ttl = 300000) { // 5 min default TTL
        const serialized = this.serialize(value);
        const size = this.getSize(serialized);
        
        // Check if we need to evict
        if (this.size + size > this.maxSize) {
            this.evict(size);
        }
        
        const entry = {
            value: serialized,
            size: size,
            expires: Date.now() + ttl,
            hits: 0
        };
        
        // Update cache
        if (this.cache.has(key)) {
            const oldEntry = this.cache.get(key);
            this.size -= oldEntry.size;
        }
        
        this.cache.set(key, entry);
        this.lru.set(key, Date.now());
        this.size += size;
        
        return true;
    }

    get(key) {
        if (!this.cache.has(key)) {
            this.misses++;
            return null;
        }
        
        const entry = this.cache.get(key);
        
        // Check expiration
        if (entry.expires < Date.now()) {
            this.delete(key);
            this.misses++;
            return null;
        }
        
        // Update LRU
        this.lru.delete(key);
        this.lru.set(key, Date.now());
        entry.hits++;
        this.hits++;
        
        return this.deserialize(entry.value);
    }

    delete(key) {
        if (!this.cache.has(key)) return false;
        
        const entry = this.cache.get(key);
        this.size -= entry.size;
        this.cache.delete(key);
        this.lru.delete(key);
        
        return true;
    }

    clear() {
        this.cache.clear();
        this.lru.clear();
        this.size = 0;
        this.hits = 0;
        this.misses = 0;
    }

    evict(needed) {
        const entries = Array.from(this.lru.entries())
            .sort((a, b) => a[1] - b[1]); // Oldest first
        
        let freed = 0;
        for (const [key] of entries) {
            if (freed >= needed) break;
            
            const entry = this.cache.get(key);
            freed += entry.size;
            this.delete(key);
        }
    }

    cleanup() {
        const now = Date.now();
        const expired = [];
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expires < now) {
                expired.push(key);
            }
        }
        
        expired.forEach(key => this.delete(key));
    }

    serialize(value) {
        if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
            return { type: 'buffer', data: value };
        }
        return { type: 'json', data: JSON.stringify(value) };
    }

    deserialize(serialized) {
        if (serialized.type === 'buffer') {
            return serialized.data;
        }
        return JSON.parse(serialized.data);
    }

    getSize(serialized) {
        if (serialized.type === 'buffer') {
            return serialized.data.byteLength;
        }
        return serialized.data.length * 2; // Approximate UTF-16 size
    }

    getStats() {
        const hitRate = this.hits + this.misses > 0 
            ? (this.hits / (this.hits + this.misses)) * 100 
            : 0;
        
        return {
            size: this.size,
            maxSize: this.maxSize,
            usage: (this.size / this.maxSize) * 100,
            entries: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: hitRate.toFixed(2) + '%'
        };
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}