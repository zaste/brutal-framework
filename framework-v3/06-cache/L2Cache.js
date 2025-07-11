/**
 * L2 IndexedDB Cache - Persistent storage with compression
 * Async operations with versioning support
 */

export class L2Cache {
    constructor(dbName = 'brutal-cache', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.ready = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Cache store
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('expires', 'expires', { unique: false });
                    cacheStore.createIndex('size', 'size', { unique: false });
                }
                
                // Metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    async set(key, value, ttl = 3600000) { // 1 hour default
        await this.ready;
        
        const compressed = await this.compress(value);
        const entry = {
            key,
            value: compressed,
            size: compressed.byteLength,
            expires: Date.now() + ttl,
            created: Date.now(),
            compressed: true,
            version: this.version
        };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put(entry);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async get(key) {
        await this.ready;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = async () => {
                const entry = request.result;
                
                if (!entry) {
                    resolve(null);
                    return;
                }
                
                // Check expiration
                if (entry.expires < Date.now()) {
                    await this.delete(key);
                    resolve(null);
                    return;
                }
                
                // Decompress and return
                const value = await this.decompress(entry.value);
                resolve(value);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async delete(key) {
        await this.ready;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        await this.ready;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async cleanup() {
        await this.ready;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('expires');
            const range = IDBKeyRange.upperBound(Date.now());
            const request = index.openCursor(range);
            
            const expired = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    expired.push(cursor.value.key);
                    cursor.continue();
                } else {
                    // Delete all expired
                    Promise.all(expired.map(key => this.delete(key)))
                        .then(() => resolve(expired.length));
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async getSize() {
        await this.ready;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.openCursor();
            
            let totalSize = 0;
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    totalSize += cursor.value.size;
                    count++;
                    cursor.continue();
                } else {
                    resolve({ totalSize, count });
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Simple compression using CompressionStream API
    async compress(data) {
        const json = JSON.stringify(data);
        const blob = new Blob([json]);
        const stream = blob.stream();
        
        if ('CompressionStream' in window) {
            const compressedStream = stream.pipeThrough(
                new CompressionStream('gzip')
            );
            const compressedBlob = await new Response(compressedStream).blob();
            return await compressedBlob.arrayBuffer();
        }
        
        // Fallback: no compression
        return await blob.arrayBuffer();
    }

    async decompress(buffer) {
        const blob = new Blob([buffer]);
        const stream = blob.stream();
        
        if ('DecompressionStream' in window) {
            try {
                const decompressedStream = stream.pipeThrough(
                    new DecompressionStream('gzip')
                );
                const decompressedBlob = await new Response(decompressedStream).blob();
                const text = await decompressedBlob.text();
                return JSON.parse(text);
            } catch (e) {
                // Fall through to direct parse
            }
        }
        
        // Fallback or uncompressed
        const text = await blob.text();
        return JSON.parse(text);
    }

    async getStats() {
        const { totalSize, count } = await this.getSize();
        
        // Estimate quota
        let quota = { usage: 0, quota: 0 };
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            quota = await navigator.storage.estimate();
        }
        
        return {
            entries: count,
            size: totalSize,
            sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
            quotaUsage: quota.usage,
            quotaTotal: quota.quota,
            quotaPercent: quota.quota > 0 ? ((quota.usage / quota.quota) * 100).toFixed(2) : 0
        };
    }

    destroy() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}