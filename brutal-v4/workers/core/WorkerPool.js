/**
 * BRUTAL V4 - Worker Pool
 * Manages a pool of workers for parallel task execution
 */

import { WorkerProxy } from './WorkerProxy.js';
import { devLog, devWarn } from '../../build/env.js';

/**
 * WorkerPool - Manages multiple workers for load balancing
 */
export class WorkerPool {
    constructor(config) {
        this.name = config.name;
        this.size = config.size || 4;
        this.workerScript = config.workerScript;
        this.workerType = config.workerType || 'classic';
        
        this.workers = [];
        this.proxies = [];
        this.taskQueue = [];
        this.busyWorkers = new Set();
        this.roundRobinIndex = 0;
        
        this.stats = {
            tasksExecuted: 0,
            tasksQueued: 0,
            totalExecutionTime: 0,
            errors: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize worker pool
     */
    initialize() {
        for (let i = 0; i < this.size; i++) {
            try {
                const worker = new Worker(this.workerScript, {
                    type: this.workerType,
                    name: `${this.name}-${i}`
                });
                
                const proxy = new WorkerProxy(worker);
                
                this.workers.push(worker);
                this.proxies.push(proxy);
                
            } catch (error) {
                devWarn(`Failed to create worker ${i} in pool '${this.name}':`, error);
            }
        }
        
        devLog(`Initialized worker pool '${this.name}' with ${this.workers.length} workers`);
    }
    
    /**
     * Get next available worker using round-robin
     */
    getNextWorker() {
        // Try to find an idle worker
        for (let i = 0; i < this.proxies.length; i++) {
            const index = (this.roundRobinIndex + i) % this.proxies.length;
            if (!this.busyWorkers.has(index)) {
                this.roundRobinIndex = (index + 1) % this.proxies.length;
                return { proxy: this.proxies[index], index };
            }
        }
        
        // All workers busy, use round-robin anyway
        const index = this.roundRobinIndex;
        this.roundRobinIndex = (this.roundRobinIndex + 1) % this.proxies.length;
        return { proxy: this.proxies[index], index };
    }
    
    /**
     * Execute task on next available worker
     */
    async execute(task, data) {
        const startTime = performance.now();
        this.stats.tasksQueued++;
        
        // Get next worker
        const { proxy, index } = this.getNextWorker();
        this.busyWorkers.add(index);
        
        try {
            const result = await proxy.execute(task, data);
            
            this.stats.tasksExecuted++;
            this.stats.totalExecutionTime += performance.now() - startTime;
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            throw error;
            
        } finally {
            this.busyWorkers.delete(index);
            this.processQueue();
        }
    }
    
    /**
     * Queue task for execution
     */
    queueTask(task, data) {
        return new Promise((resolve, reject) => {
            this.taskQueue.push({ task, data, resolve, reject });
            this.processQueue();
        });
    }
    
    /**
     * Process queued tasks
     */
    processQueue() {
        while (this.taskQueue.length > 0 && this.busyWorkers.size < this.proxies.length) {
            const { task, data, resolve, reject } = this.taskQueue.shift();
            
            this.execute(task, data)
                .then(resolve)
                .catch(reject);
        }
    }
    
    /**
     * Broadcast message to all workers
     */
    broadcast(message) {
        this.proxies.forEach(proxy => {
            proxy.postMessage(message);
        });
    }
    
    /**
     * Map operation across all workers
     */
    async map(items, task) {
        const chunkSize = Math.ceil(items.length / this.size);
        const chunks = [];
        
        // Split items into chunks
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        
        // Execute chunks in parallel
        const promises = chunks.map((chunk, index) => {
            return this.proxies[index % this.proxies.length].execute(task, chunk);
        });
        
        const results = await Promise.all(promises);
        
        // Flatten results
        return results.flat();
    }
    
    /**
     * Reduce operation across all workers
     */
    async reduce(items, task, initialValue) {
        // First, map the operation
        const mapped = await this.map(items, task);
        
        // Then reduce on main thread (could be optimized)
        return mapped.reduce((acc, val) => acc + val, initialValue);
    }
    
    /**
     * Get pool statistics
     */
    getStats() {
        return {
            size: this.size,
            activeWorkers: this.workers.length,
            busyWorkers: this.busyWorkers.size,
            queuedTasks: this.taskQueue.length,
            ...this.stats,
            avgExecutionTime: this.stats.tasksExecuted > 0 
                ? this.stats.totalExecutionTime / this.stats.tasksExecuted 
                : 0
        };
    }
    
    /**
     * Terminate all workers in pool
     */
    terminate() {
        this.workers.forEach((worker, index) => {
            worker.terminate();
            this.proxies[index].terminate();
        });
        
        this.workers = [];
        this.proxies = [];
        this.taskQueue = [];
        this.busyWorkers.clear();
        
        devLog(`Terminated worker pool '${this.name}'`);
    }
}