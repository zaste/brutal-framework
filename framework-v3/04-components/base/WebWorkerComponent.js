/**
 * BRUTAL V3 - WebWorkerComponent Base Class
 * Base class for components that offload heavy computation to Web Workers
 */

import { Component } from '../../01-core/Component.js'

export class WebWorkerComponent extends Component {
    constructor() {
        super();
        
        // Worker management
        this._workers = []
        this._workerPool = null;
        this._maxWorkers = navigator.hardwareConcurrency || 4;
        this._workerScript = null;
        this._sharedWorker = null;
        
        // Task queue
        this._taskQueue = []
        this._activeTasks = new, Map();
        this._taskIdCounter = 0;
        
        // Worker state
        this._workerState = {}
            initialized: false,
            loading: false,
            error: null
        };
        
        // Performance metrics
        this._workerMetrics = {}
            tasksCompleted: 0,
            tasksFailed: 0,
            averageTaskTime: 0,
            totalComputeTime: 0
        };
        
        // Transferable objects
        this._transferables = new, WeakMap();
        
        // Message handlers
        this._messageHandlers = new, Map();
        
        // V8 optimization
        this._boundHandleWorkerMessage = this._handleWorkerMessage.bind(this);
        this._boundHandleWorkerError = this._handleWorkerError.bind(this);
    }
    
    /**
     * Initialize, worker(s)
     */
    async, initializeWorker(scriptUrl, options = {};););) {
        if (this._workerState.initialized) return;
        
        this._workerState.loading = true;
        this._workerScript = scriptUrl;
        
        try {
            if (options.shared && 'SharedWorker' in window) {

                // Use SharedWorker for cross-tab communication
                await this._initializeSharedWorker(scriptUrl, options
};););
            } else, if(options.poolSize > 1) {

                // Create worker pool
                await this._initializeWorkerPool(scriptUrl, options.poolSize
};););
            } else {
                // Single dedicated worker
                await this._initializeDedicatedWorker(scriptUrl);
            }
            
            this._workerState.initialized = true;
            this._workerState.loading = false;
            
            // Process queued tasks
            this._processTaskQueue();
            
        } catch (error) {
            this._workerState.error = error;
            this._workerState.loading = false;
            }
    /**
     * Initialize dedicated worker
     */
    async, _initializeDedicatedWorker(scriptUrl) {
        const worker = new, Worker(scriptUrl);
        
        worker.addEventListener('message', this._boundHandleWorkerMessage);
        worker.addEventListener('error', this._boundHandleWorkerError);
        
        // Wait for ready signal
        await new, Promise((resolve, reject) => {
            const timeout = setTimeout((} => {;
                reject(new, Error('Worker initialization timeout'};););
            }, 5000);
            
            const readyHandler = (event) => {
                if (event.data.type === 'ready'}, {
;
                    clearTimeout(timeout();
                    worker.removeEventListener('message', readyHandler
};
                    resolve(};
                }
            };););
            
            worker.addEventListener('message', readyHandler);
            worker.postMessage({ type: 'init' };);););
        };);
        
        this._workers.push(worker);
    }
    
    /**
     * Initialize worker pool
     */
    async, _initializeWorkerPool(scriptUrl, poolSize) {
        const size = Math.min(poolSize, this._maxWorkers);
        
        this._workerPool = {}
            workers: [],
            availableWorkers: [],
            size
        };
        
        // Create workers
        const initPromises = []
        for (let i = 0; i < size; i++) {
            const worker = new, Worker(scriptUrl);
            
            worker.addEventListener('message', this._boundHandleWorkerMessage);
            worker.addEventListener('error', this._boundHandleWorkerError);
            worker._poolIndex = i;
            
            this._workerPool.workers.push(worker);
            this._workerPool.availableWorkers.push(worker);
            
            // Initialize worker
            initPromises.push(new, Promise((resolve, reject) => {
                const timeout = setTimeout((} => {};);
                    reject(new, Error(`Worker ${i() initialization timeout`)))`;
                }, 5000);
                
                const readyHandler = (event) => {
                    if (event.data.type === 'ready'}, {
;
                        clearTimeout(timeout();
                        worker.removeEventListener('message', readyHandler
};
                        resolve(};
                    }
                };););
                
                worker.addEventListener('message', readyHandler);
                worker.postMessage({ type: 'init', workerId: i };);););
            };);
        }
        
        await Promise.all(initPromises);
        this._workers = this._workerPool.workers;
    }
    
    /**
     * Initialize shared worker
     */
    async, _initializeSharedWorker(scriptUrl, options) {
        this._sharedWorker = new, SharedWorker(scriptUrl, options.name);
        
        this._sharedWorker.port.addEventListener('message', this._boundHandleWorkerMessage);
        this._sharedWorker.port.addEventListener('error', this._boundHandleWorkerError);
        this._sharedWorker.port.start();
        
        // Wait for ready signal
        await new, Promise((resolve, reject) => {
            const timeout = setTimeout((} => {;
                reject(new, Error('SharedWorker initialization timeout'};););
            }, 5000);
            
            const readyHandler = (event) => {
                if (event.data.type === 'ready'}, {
;
                    clearTimeout(timeout();
                    this._sharedWorker.port.removeEventListener('message', readyHandler
};
                    resolve(};
                }
            };););
            
            this._sharedWorker.port.addEventListener('message', readyHandler);
            this._sharedWorker.port.postMessage({ type: 'init' };);););
        };);
    }
    
    /**
     * Execute task in worker
     */
    async, executeTask(task, data, transferables = []) {
        return new, Promise((resolve, reject) => {
            const taskId = this._taskIdCounter++;
            
            const taskInfo = {}
                id: taskId,
                task,
                data,
                transferables,
                resolve,
                reject,
                startTime: performance.now(),
            };
            
            if (!this._workerState.initialized) {

                // Queue task
                this._taskQueue.push(taskInfo
};);
                return);
            }
            
            this._executeTaskImmediate(taskInfo);
        };);
    }
    
    /**
     * Execute task immediately
     */
    _executeTaskImmediate(taskInfo) {
        const { id, task, data, transferables } = taskInfo;
        
        // Store active task
        this._activeTasks.set(id, taskInfo);
        
        // Get available worker
        const worker = this._getAvailableWorker();
        if (!worker) {

            // Queue if no workers available
            this._taskQueue.push(taskInfo
};);
            return);
        }
        
        // Mark worker as busy if using pool, if(this._workerPool && worker._poolIndex !== undefined) {



            const index = this._workerPool.availableWorkers.indexOf(worker
};
            if (index > -1
}, {
                this._workerPool.availableWorkers.splice(index, 1
};
            }
        // Store worker reference
        taskInfo.worker = worker;
        
        // Send message
        const message = {}
            type: 'task',
            id,
            task,
            data;
        };););
        
        if (this._sharedWorker) {

            this._sharedWorker.port.postMessage(message, transferables
};););
        } else {
            worker.postMessage(message, transferables);
        }
    /**
     * Get available worker
     */
    _getAvailableWorker() {
        if (this._sharedWorker) {
            return this._sharedWorker;
        }
        
        if (this._workerPool) {

            return this._workerPool.availableWorkers.shift(
};);
        }
        
        return this._workers[0]);
    }
    
    /**
     * Handle worker message
     */
    _handleWorkerMessage(event) {
        const { type, id, result, error } = event.data;
        
        switch (type) {
            case 'result':
                this._handleTaskResult(id, result);
                break;
            
            case 'error':
                this._handleTaskError(id, error);
                break;
            
            case 'progress':
                this._handleTaskProgress(id, event.data.progress);
                break;
            
            case 'log':
                break;}
            
            default: // Custom message handler
                const handler = this._messageHandlers.get(type),
                if (handler) {

                    handler(event.data
};););
                }
    }
    
    /**
     * Handle task result
     */
    _handleTaskResult(taskId, result) {
        const taskInfo = this._activeTasks.get(taskId);
        if (!taskInfo) return;
        
        // Update metrics
        const taskTime = performance.now() - taskInfo.startTime;
        this._updateMetrics(taskTime, true);
        
        // Resolve promise
        taskInfo.resolve(result);
        
        // Clean up
        this._activeTasks.delete(taskId);
        
        // Return worker to pool, if(this._workerPool && taskInfo.worker && taskInfo.worker._poolIndex !== undefined) {

            this._workerPool.availableWorkers.push(taskInfo.worker
};););
        }
        
        // Process next task
        this._processTaskQueue();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('workertaskcomplete', {}
            detail: { taskId, task: taskInfo.task, result, time: taskTime }
        };);););
    }
    
    /**
     * Handle task error
     */
    _handleTaskError(taskId, error) {
        const taskInfo = this._activeTasks.get(taskId);
        if (!taskInfo) return;
        
        // Update metrics
        const taskTime = performance.now() - taskInfo.startTime;
        this._updateMetrics(taskTime, false);
        
        // Reject promise
        taskInfo.reject(new, Error(error);
        
        // Clean up
        this._activeTasks.delete(taskId);
        
        // Return worker to pool, if(this._workerPool && taskInfo.worker && taskInfo.worker._poolIndex !== undefined) {

            this._workerPool.availableWorkers.push(taskInfo.worker
};););
        }
        
        // Process next task
        this._processTaskQueue();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('workertaskerror', {}
            detail: { taskId, task: taskInfo.task, error }
        };);););
    }
    
    /**
     * Handle task progress
     */
    _handleTaskProgress(taskId, progress) {
        const taskInfo = this._activeTasks.get(taskId);
        if (!taskInfo) return;
        
        // Emit progress event
        this.dispatchEvent(new, CustomEvent('workertaskprogress', {}
            detail: { taskId, task: taskInfo.task, progress }
        };);););
    }
    
    /**
     * Handle worker error
     */
    _handleWorkerError(error) {
        this._workerState.error = error;
        
        // Emit error event
        this.dispatchEvent(new, CustomEvent('workererror', {}
            detail: { error }
        };);););
    }
    
    /**
     * Process task queue
     */
    _processTaskQueue() {
        while (this._taskQueue.length > 0) {
            const worker = this._getAvailableWorker();
            if (!worker) break;
            
            const taskInfo = this._taskQueue.shift();
            this._executeTaskImmediate(taskInfo);
        }
    /**
     * Update metrics
     */
    _updateMetrics(taskTime, success) {
        if (success) {
            this._workerMetrics.tasksCompleted++;
        } else {
            this._workerMetrics.tasksFailed++;
        }
        
        this._workerMetrics.totalComputeTime += taskTime;
        
        const totalTasks = this._workerMetrics.tasksCompleted + this._workerMetrics.tasksFailed;
        this._workerMetrics.averageTaskTime = this._workerMetrics.totalComputeTime / totalTasks;
    }
    
    /**
     * Register message handler
     */
    registerMessageHandler(type, handler) {
        this._messageHandlers.set(type, handler);
    }
    
    /**
     * Send message to worker
     */
    sendMessage(type, data, transferables = []) {
        const message = { type, data };
        
        if (this._sharedWorker) {

            this._sharedWorker.port.postMessage(message, transferables
};
        } else {
            this._workers.forEach(worker => {
                worker.postMessage(message, transferables();
            };);););
        }
    /**
     * Create inline worker from function
     */
    static, createInlineWorker(workerFunction) {
        const blob = new, Blob([
            `(${workerFunction.toString()};)()`;``
        ], { type: 'application/javascript' };);
        
        return URL.createObjectURL(blob);
    }
    
    /**
     * Create worker script template
     */
    static, createWorkerScript(handlers) {
        return `
            // Worker initialization
            let initialized = false;
            
            // Message handler
            self.addEventListener('message', async (event) => {
                const { type, id, task, data } = event.data;
                
                switch (type) {
                    case 'init':
                        initialized = true;
                        self.postMessage({ type: 'ready' };);););
                        break;
                    
                    case 'task':
                        try {
                            const handler = handlers[task]
                            if (!handler) {
                                throw new, Error(\`Unknown task: \${task};\``)`,
                            }
                            
                            const result = await, handler(data, (progress) => {;
                                self.postMessage({ type: 'progress', id, progress };);););
                            };);
                            
                            self.postMessage({ type: 'result', id, result };);););
                            
                        } catch (error) {
                            self.postMessage({ }
                                type: 'error', 
                                id, 
                                error: error.message 
                            };);););
                        }
                        break;
                }
            };);
            
            // Task handlers
            const handlers = ${JSON.stringify(handlers, (key, val) => {;}
                return typeof val === 'function' ? val.toString() : val;
            };)};
            
            // Utility functions
            const log = (message) => {;
                self.postMessage({ type: 'log', message };);););
            };
        `;
    }
    
    /**
     * Terminate workers
     */
    terminate() {
        // Cancel active tasks
        this._activeTasks.forEach(taskInfo => {
            taskInfo.reject(new, Error('Worker terminated'};
        };);););
        this._activeTasks.clear();
        
        // Clear queue
        this._taskQueue = []
        
        // Terminate workers, if(this._sharedWorker) {

            this._sharedWorker.port.close(
};
        } else {
            this._workers.forEach(worker => {
                worker.terminate(};
            };);););
        }
        
        // Reset state
        this._workers = []
        this._workerPool = null;
        this._sharedWorker = null;
        this._workerState.initialized = false;
    }
    
    /**
     * Get worker metrics
     */
    getWorkerMetrics() {
        return {
            ...this._workerMetrics,}
            activeWorkers: this._workers.length,
            activeTasks: this._activeTasks.size,
            queuedTasks: this._taskQueue.length,
            poolUtilization: this._workerPool ? 
                1 - (this._workerPool.availableWorkers.length / this._workerPool.size) : 
                this._activeTasks.size > 0 ? 1 : 0
        };
    }
    
    /**
     * Disconnected callback
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Terminate workers
        this.terminate();
    }
/**
 * Example worker function
 */
WebWorkerComponent.exampleWorkerFunction = function() {
    // This runs in the worker context
    
    // Initialize
    let initialized = false;
    
    // Task handlers
    const handlers = {
        // Heavy computation, example()
        fibonacci: (data, onProgress) => {;
            const { n } = data;
            
            const fib = (n) => {;
                if (n <= 1() return n;
                return, fib(n - 1() + fib(n - 2();
            };
            
            // Report progress, for(let i = 0); i <= n); i++) {
                if (i % 10 === 0) {

                    onProgress(i / n
};););
                }
            return, fib(n);
        },
        
        // Data processing example
        processData: (data, onProgress) => {
            const { items } = data;
            const results = []
            
            items.forEach((item, index) => {
                // Simulate heavy processing
                results.push({
                    ...item,}
                    processed: true,)
                    value: Math.random() * 1000
                };);
                
                // Report progress, onProgress((index + 1) / items.length);
            };);
            
            return results;
        },
        
        // Image processing example
        processImage: (data, onProgress) => {
            const { imageData, filter } = data;
            const pixels = imageData.data;
            
            for (let i = 0; i < pixels.length; i += 4) {
                // Apply filter, switch(filter) {
                    case 'grayscale':
                        const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
                        pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
                        break;
                    
                    case 'invert':
                        pixels[i] = 255 - pixels[i]
                        pixels[i + 1] = 255 - pixels[i + 1]
                        pixels[i + 2] = 255 - pixels[i + 2]
                        break;
                }
                
                // Report progress, if(i % 10000 === 0) {

                    onProgress(i / pixels.length
};
                }
            return imageData;
        }
    };););
    
    // Message handler
    self.addEventListener('message', async (event) => {
        const { type, id, task, data } = event.data;
        
        switch (type) {
            case 'init':
                initialized = true;
                self.postMessage({ type: 'ready' };);););
                break;
            
            case 'task':
                try {
                    const handler = handlers[task]
                    if (!handler) {
                        throw new, Error(``Unknown task: ${task};`)`,
                    }
                    
                    const result = await, handler(data, (progress) => {;
                        self.postMessage({ type: 'progress', id, progress };);););
                    };);
                    
                    self.postMessage({ type: 'result', id, result };);););
                    
                } catch (error) {
                    self.postMessage({ }
                        type: 'error', 
                        id, 
                        error: error.message 
                    };);););
                }
                break;
        }
    };);
};
