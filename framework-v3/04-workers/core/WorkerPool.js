/**
 * @fileoverview BRUTAL WorkerPool - Dynamic worker management with auto-scaling
 * @version 1.0.0
 * @license MIT
 */

import { MessageBroker } from './MessageBroker.js';
import { SharedMemory } from './SharedMemory.js';

/**
 * WorkerPool manages a dynamic pool of Web Workers with:
 * - Auto-scaling based on workload
 * - Load balancing (round-robin + least-busy)
 * - Health monitoring and recovery
 * - SharedArrayBuffer support
 */
export class WorkerPool {
    constructor(config = {}) {
        this.config = {
            minWorkers: 2,
            maxWorkers: navigator.hardwareConcurrency || 4,
            workerScript: null,
            idleTimeout: 30000, // 30s before killing idle workers
            healthCheckInterval: 5000, // 5s health checks
            taskTimeout: 10000, // 10s task timeout
            ...config
        };

        this.workers = new Map();
        this.taskQueue = [];
        this.pendingTasks = new Map();
        this.metrics = {
            tasksCompleted: 0,
            tasksFailed: 0,
            averageTaskTime: 0,
            workerUtilization: new Map()
        };

        this.messageBroker = new MessageBroker();
        this.sharedMemory = null;
        this.isInitialized = false;
        this.currentWorkerIndex = 0;
    }

    /**
     * Initialize the worker pool
     */
    async init() {
        if (this.isInitialized) return;

        // Initialize shared memory
        if (typeof SharedArrayBuffer !== 'undefined') {
            this.sharedMemory = new SharedMemory({
                size: 1024 * 1024 * 16 // 16MB initial size
            });
            await this.sharedMemory.init();
        }

        // Create initial workers
        for (let i = 0; i < this.config.minWorkers; i++) {
            await this.createWorker();
        }

        // Start health monitoring
        this.startHealthMonitoring();
        
        this.isInitialized = true;
        }

    /**
     * Create a new worker
     */
    async createWorker() {
        if (this.workers.size >= this.config.maxWorkers) {
            return null;
        }

        const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // Create worker with inline code if no script provided
            let worker;
            if (this.config.workerScript) {
                worker = new Worker(this.config.workerScript);
            } else {
                // Default worker implementation
                const workerCode = this.getDefaultWorkerCode();
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                worker = new Worker(URL.createObjectURL(blob));
            }

            // Setup worker
            const workerInfo = {
                id: workerId,
                worker,
                busy: false,
                tasksCompleted: 0,
                lastActivity: Date.now(),
                health: 'healthy'
            };

            // Message handling
            worker.onmessage = (e) => this.handleWorkerMessage(workerId, e);
            worker.onerror = (e) => this.handleWorkerError(workerId, e);

            // Initialize worker with shared memory if available
            if (this.sharedMemory) {
                worker.postMessage({
                    type: 'INIT',
                    workerId,
                    sharedBuffer: this.sharedMemory.buffer,
                    config: {
                        memorySize: this.sharedMemory.size,
                        offsets: this.sharedMemory.getOffsets()
                    }
                });
            }

            this.workers.set(workerId, workerInfo);
            this.metrics.workerUtilization.set(workerId, 0);
            
            return workerId;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get default worker implementation
     */
    getDefaultWorkerCode() {
        return `
            // BRUTAL Default Worker Implementation
            let sharedBuffer = null;
            let sharedView = null;
            let workerId = null;

            // Message handler
            self.onmessage = async function(e) {
                const { type, data, taskId } = e.data;

                switch (type) {
                    case 'INIT':
                        workerId = e.data.workerId;
                        if (e.data.sharedBuffer) {
                            sharedBuffer = e.data.sharedBuffer;
                            sharedView = new Int32Array(sharedBuffer);
                        }
                        self.postMessage({ type: 'READY', workerId });
                        break;

                    case 'TASK':
                        try {
                            const startTime = performance.now();
                            const result = await processTask(data);
                            const duration = performance.now() - startTime;
                            
                            self.postMessage({
                                type: 'RESULT',
                                taskId,
                                result,
                                duration,
                                workerId
                            });
                        } catch (error) {
                            self.postMessage({
                                type: 'ERROR',
                                taskId,
                                error: error.message,
                                workerId
                            });
                        }
                        break;

                    case 'HEALTH_CHECK':
                        self.postMessage({ 
                            type: 'HEALTH_RESPONSE', 
                            workerId,
                            memory: performance.memory ? performance.memory.usedJSHeapSize : 0
                        });
                        break;

                    case 'TERMINATE':
                        self.close();
                        break;
                }
            };

            // Task processor - override this for specific worker types
            async function processTask(data) {
                const { operation, params } = data;

                switch (operation) {
                    case 'COMPUTE':
                        return performComputation(params);
                    case 'RENDER':
                        return performRendering(params);
                    case 'DATA':
                        return processData(params);
                    default:
                        throw new Error(\`Unknown operation: \${operation}\`);
                }
            }

            // Default computation
            function performComputation(params) {
                let result = 0;
                const iterations = params.iterations || 1000000;
                for (let i = 0; i < iterations; i++) {
                    result += Math.sqrt(i) * Math.sin(i);
                }
                return result;
            }

            // Default rendering calculation
            function performRendering(params) {
                // Virtual DOM diff simulation
                const { oldVDOM, newVDOM } = params;
                const patches = [];
                // Simplified diff algorithm
                if (JSON.stringify(oldVDOM) !== JSON.stringify(newVDOM)) {
                    patches.push({ type: 'UPDATE', target: 'root', data: newVDOM });
                }
                return patches;
            }

            // Default data processing
            function processData(params) {
                const { data, operation } = params;
                switch (operation) {
                    case 'sort':
                        return [...data].sort((a, b) => a - b);
                    case 'filter':
                        return data.filter(x => x > params.threshold);
                    case 'map':
                        return data.map(x => x * 2);
                    default:
                        return data;
                }
            }
        `;
    }

    /**
     * Execute a task on the pool
     */
    async execute(task, options = {}) {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return new Promise((resolve, reject) => {
            const taskInfo = {
                id: taskId,
                task,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            };

            this.pendingTasks.set(taskId, taskInfo);
            this.taskQueue.push(taskInfo);
            this.processQueue();

            // Task timeout
            if (options.timeout || this.config.taskTimeout) {
                setTimeout(() => {
                    if (this.pendingTasks.has(taskId)) {
                        this.pendingTasks.delete(taskId);
                        reject(new Error('Task timeout'));
                    }
                }, options.timeout || this.config.taskTimeout);
            }
        });
    }

    /**
     * Process the task queue
     */
    async processQueue() {
        if (this.taskQueue.length === 0) return;

        // Scale up if needed
        if (this.shouldScaleUp()) {
            await this.createWorker();
        }

        // Find available worker
        const worker = this.selectWorker();
        if (!worker) {
            // All workers busy, wait for next availability
            return;
        }

        // Get next task
        const taskInfo = this.taskQueue.shift();
        if (!taskInfo) return;

        // Mark worker as busy
        worker.busy = true;
        worker.lastActivity = Date.now();

        // Send task to worker
        worker.worker.postMessage({
            type: 'TASK',
            taskId: taskInfo.id,
            data: taskInfo.task
        });

        // Continue processing queue
        if (this.taskQueue.length > 0) {
            this.processQueue();
        }
    }

    /**
     * Select best worker for task (load balancing)
     */
    selectWorker() {
        let bestWorker = null;
        let minTasks = Infinity;

        // Find least busy worker
        for (const [id, worker] of this.workers) {
            if (!worker.busy && worker.health === 'healthy') {
                if (worker.tasksCompleted < minTasks) {
                    minTasks = worker.tasksCompleted;
                    bestWorker = worker;
                }
            }
        }

        return bestWorker;
    }

    /**
     * Check if should scale up workers
     */
    shouldScaleUp() {
        const busyWorkers = Array.from(this.workers.values()).filter(w => w.busy).length;
        const utilization = busyWorkers / this.workers.size;
        
        return utilization > 0.8 && 
               this.workers.size < this.config.maxWorkers && 
               this.taskQueue.length > this.workers.size;
    }

    /**
     * Check if should scale down workers
     */
    shouldScaleDown() {
        if (this.workers.size <= this.config.minWorkers) return false;
        
        const idleWorkers = Array.from(this.workers.values()).filter(w => {
            return !w.busy && (Date.now() - w.lastActivity) > this.config.idleTimeout;
        });
        
        return idleWorkers.length > 0;
    }

    /**
     * Handle worker messages
     */
    handleWorkerMessage(workerId, event) {
        const worker = this.workers.get(workerId);
        if (!worker) return;

        const { type, taskId, result, error, duration } = event.data;

        switch (type) {
            case 'READY':
                break;

            case 'RESULT':
                this.handleTaskComplete(workerId, taskId, result, duration);
                break;

            case 'ERROR':
                this.handleTaskError(workerId, taskId, error);
                break;

            case 'HEALTH_RESPONSE':
                worker.health = 'healthy';
                worker.lastActivity = Date.now();
                break;
        }
    }

    /**
     * Handle task completion
     */
    handleTaskComplete(workerId, taskId, result, duration) {
        const worker = this.workers.get(workerId);
        const task = this.pendingTasks.get(taskId);

        if (worker) {
            worker.busy = false;
            worker.tasksCompleted++;
            worker.lastActivity = Date.now();

            // Update metrics
            this.metrics.tasksCompleted++;
            this.updateAverageTaskTime(duration);
        }

        if (task) {
            this.pendingTasks.delete(taskId);
            task.resolve(result);
        }

        // Process next task
        this.processQueue();
    }

    /**
     * Handle task error
     */
    handleTaskError(workerId, taskId, error) {
        const worker = this.workers.get(workerId);
        const task = this.pendingTasks.get(taskId);

        if (worker) {
            worker.busy = false;
            worker.health = 'error';
            this.metrics.tasksFailed++;
        }

        if (task) {
            this.pendingTasks.delete(taskId);
            task.reject(new Error(error));
        }

        // Process next task
        this.processQueue();
    }

    /**
     * Handle worker error
     */
    handleWorkerError(workerId, error) {
        const worker = this.workers.get(workerId);
        
        if (worker) {
            worker.health = 'error';
            
            // Terminate and replace worker
            this.terminateWorker(workerId);
            this.createWorker();
        }
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthInterval = setInterval(() => {
            // Check worker health
            for (const [id, worker] of this.workers) {
                if (worker.health === 'healthy') {
                    worker.worker.postMessage({ type: 'HEALTH_CHECK' });
                }
            }

            // Scale down if needed
            if (this.shouldScaleDown()) {
                const idleWorker = Array.from(this.workers.values()).find(w => 
                    !w.busy && (Date.now() - w.lastActivity) > this.config.idleTimeout
                );
                if (idleWorker) {
                    this.terminateWorker(idleWorker.id);
                }
            }

            // Update utilization metrics
            this.updateUtilizationMetrics();
        }, this.config.healthCheckInterval);
    }

    /**
     * Update utilization metrics
     */
    updateUtilizationMetrics() {
        for (const [id, worker] of this.workers) {
            const utilization = worker.busy ? 100 : 0;
            this.metrics.workerUtilization.set(id, utilization);
        }
    }

    /**
     * Update average task time
     */
    updateAverageTaskTime(duration) {
        const total = this.metrics.tasksCompleted;
        const currentAvg = this.metrics.averageTaskTime;
        this.metrics.averageTaskTime = (currentAvg * (total - 1) + duration) / total;
    }

    /**
     * Terminate a specific worker
     */
    terminateWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (!worker) return;

        worker.worker.postMessage({ type: 'TERMINATE' });
        worker.worker.terminate();
        this.workers.delete(workerId);
        this.metrics.workerUtilization.delete(workerId);
        
        }

    /**
     * Get pool statistics
     */
    getStats() {
        const workers = Array.from(this.workers.values());
        const utilization = Array.from(this.metrics.workerUtilization.values());
        
        return {
            workers: {
                total: this.workers.size,
                busy: workers.filter(w => w.busy).length,
                idle: workers.filter(w => !w.busy).length,
                healthy: workers.filter(w => w.health === 'healthy').length
            },
            tasks: {
                completed: this.metrics.tasksCompleted,
                failed: this.metrics.tasksFailed,
                pending: this.pendingTasks.size,
                queued: this.taskQueue.length,
                averageTime: this.metrics.averageTaskTime.toFixed(2) + 'ms'
            },
            utilization: {
                average: utilization.length > 0 
                    ? (utilization.reduce((a, b) => a + b, 0) / utilization.length).toFixed(2) + '%'
                    : '0%',
                perWorker: Object.fromEntries(this.metrics.workerUtilization)
            }
        };
    }

    /**
     * Terminate all workers and cleanup
     */
    async destroy() {
        // Stop health monitoring
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
        }

        // Terminate all workers
        for (const [id, worker] of this.workers) {
            this.terminateWorker(id);
        }

        // Clear pending tasks
        for (const [id, task] of this.pendingTasks) {
            task.reject(new Error('Worker pool destroyed'));
        }

        // Cleanup
        this.workers.clear();
        this.pendingTasks.clear();
        this.taskQueue = [];
        
        if (this.sharedMemory) {
            this.sharedMemory.destroy();
        }

        this.isInitialized = false;
        }
}