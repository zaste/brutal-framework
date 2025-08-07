/**
 * BRUTAL V4 - Worker Manager
 * Centralized worker management and coordination
 */

import { WorkerPool } from './WorkerPool.js';
import { WorkerMessage } from './WorkerMessage.js';
import { WorkerProxy } from './WorkerProxy.js';
import { devLog, devWarn, devError } from '../../build/env.js';

/**
 * WorkerManager - Manages all worker operations
 */
export class WorkerManager {
    static instance = null;
    
    constructor() {
        if (WorkerManager.instance) {
            return WorkerManager.instance;
        }
        
        this.pools = new Map();
        this.workers = new Map();
        this.proxies = new Map();
        this.isSupported = this.checkSupport();
        
        WorkerManager.instance = this;
    }
    
    /**
     * Check worker support
     */
    checkSupport() {
        const hasWorker = typeof Worker !== 'undefined';
        const hasSharedWorker = typeof SharedWorker !== 'undefined';
        const hasServiceWorker = 'serviceWorker' in navigator;
        
        return {
            worker: hasWorker,
            sharedWorker: hasSharedWorker,
            serviceWorker: hasServiceWorker,
            module: hasWorker && 'type' in new Worker('data:,', { type: 'module' })
        };
    }
    
    /**
     * Create a worker pool
     */
    createPool(name, config = {}) {
        if (this.pools.has(name)) {
            devWarn(`Worker pool '${name}' already exists`);
            return this.pools.get(name);
        }
        
        const pool = new WorkerPool({
            name,
            size: config.size || navigator.hardwareConcurrency || 4,
            workerScript: config.workerScript,
            workerType: config.workerType || 'classic',
            ...config
        });
        
        this.pools.set(name, pool);
        devLog(`Created worker pool '${name}' with ${pool.size} workers`);
        
        return pool;
    }
    
    /**
     * Get or create a worker pool
     */
    getPool(name) {
        return this.pools.get(name);
    }
    
    /**
     * Create a dedicated worker
     */
    createWorker(name, scriptUrl, options = {}) {
        if (!this.isSupported.worker) {
            devError('Web Workers are not supported');
            return null;
        }
        
        try {
            const worker = new Worker(scriptUrl, {
                type: options.module ? 'module' : 'classic',
                name,
                ...options
            });
            
            // Create proxy for easier communication
            const proxy = new WorkerProxy(worker);
            
            this.workers.set(name, worker);
            this.proxies.set(name, proxy);
            
            devLog(`Created worker '${name}'`);
            
            return proxy;
        } catch (error) {
            devError(`Failed to create worker '${name}':`, error);
            return null;
        }
    }
    
    /**
     * Get worker proxy by name
     */
    getWorker(name) {
        return this.proxies.get(name);
    }
    
    /**
     * Execute task on worker pool
     */
    async executeOnPool(poolName, task, data) {
        const pool = this.getPool(poolName);
        if (!pool) {
            throw new Error(`Worker pool '${poolName}' not found`);
        }
        
        return pool.execute(task, data);
    }
    
    /**
     * Execute task on specific worker
     */
    async executeOnWorker(workerName, task, data) {
        const proxy = this.getWorker(workerName);
        if (!proxy) {
            throw new Error(`Worker '${workerName}' not found`);
        }
        
        return proxy.execute(task, data);
    }
    
    /**
     * Broadcast message to all workers in pool
     */
    broadcastToPool(poolName, message) {
        const pool = this.getPool(poolName);
        if (!pool) {
            devWarn(`Worker pool '${poolName}' not found`);
            return;
        }
        
        pool.broadcast(message);
    }
    
    /**
     * Terminate worker
     */
    terminateWorker(name) {
        const worker = this.workers.get(name);
        const proxy = this.proxies.get(name);
        
        if (worker) {
            worker.terminate();
            this.workers.delete(name);
        }
        
        if (proxy) {
            proxy.terminate();
            this.proxies.delete(name);
        }
        
        devLog(`Terminated worker '${name}'`);
    }
    
    /**
     * Terminate worker pool
     */
    terminatePool(name) {
        const pool = this.pools.get(name);
        if (pool) {
            pool.terminate();
            this.pools.delete(name);
            devLog(`Terminated worker pool '${name}'`);
        }
    }
    
    /**
     * Terminate all workers and pools
     */
    terminateAll() {
        // Terminate individual workers
        for (const [name] of this.workers) {
            this.terminateWorker(name);
        }
        
        // Terminate pools
        for (const [name] of this.pools) {
            this.terminatePool(name);
        }
        
        devLog('Terminated all workers and pools');
    }
    
    /**
     * Get worker statistics
     */
    getStats() {
        const stats = {
            support: this.isSupported,
            pools: {},
            workers: []
        };
        
        // Pool stats
        for (const [name, pool] of this.pools) {
            stats.pools[name] = pool.getStats();
        }
        
        // Worker list
        stats.workers = Array.from(this.workers.keys());
        
        return stats;
    }
}

// Create singleton instance
export const workerManager = new WorkerManager();