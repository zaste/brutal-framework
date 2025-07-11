/**
 * BRUTAL V3 - Enhanced WebWorkerComponent
 * Integrates with the new WorkerPool, SharedMemory, and MessageBroker systems
 */

import { Component } from '../../01-core/Component.js';
import { WorkerPool } from '../../04-workers/core/WorkerPool.js';
import { SharedMemory } from '../../04-workers/core/SharedMemory.js';
import { MessageBroker } from '../../04-workers/core/MessageBroker.js';

export class WebWorkerComponent extends Component {
    constructor() {
        super();
        
        // Enhanced worker management
        this._workerPool = null;
        this._sharedMemory = null;
        this._messageBroker = null;
        
        // Configuration
        this._config = {
            useWorkerPool: true,
            useSharedMemory: true,
            useMessageBroker: true,
            minWorkers: 2,
            maxWorkers: navigator.hardwareConcurrency || 4,
            sharedMemorySize: 1024 * 1024 * 16, // 16MB
            workerScripts: {
                render: '/framework-v3/04-workers/render-worker.js',
                compute: '/framework-v3/04-workers/compute-worker.js',
                data: '/framework-v3/04-workers/data-worker.js'
            }
        };
        
        // State
        this._initialized = false;
        this._activeOperations = new Map();
        
        // Performance tracking
        this._metrics = {
            operations: 0,
            renderTasks: 0,
            computeTasks: 0,
            dataTasks: 0,
            avgOperationTime: 0,
            peakWorkers: 0
        };
        
        // Event handlers bound for V8 optimization
        this._boundHandleWorkerMessage = this._handleWorkerMessage.bind(this);
        this._boundHandleWorkerError = this._handleWorkerError.bind(this);
    }
    
    /**
     * Initialize enhanced worker system
     */
    async initialize(config = {}) {
        if (this._initialized) return;
        
        this._config = { ...this._config, ...config };
        
        try {
            // Initialize WorkerPool
            if (this._config.useWorkerPool) {
                this._workerPool = new WorkerPool({
                    minWorkers: this._config.minWorkers,
                    maxWorkers: this._config.maxWorkers,
                    workerScript: this._config.defaultWorkerScript
                });
                await this._workerPool.init();
            }
            
            // Initialize SharedMemory
            if (this._config.useSharedMemory && typeof SharedArrayBuffer !== 'undefined') {
                this._sharedMemory = new SharedMemory({
                    size: this._config.sharedMemorySize
                });
                await this._sharedMemory.init();
            }
            
            // Initialize MessageBroker
            if (this._config.useMessageBroker) {
                this._messageBroker = new MessageBroker();
                this._messageBroker.init();
                
                // Subscribe to worker events
                this._setupMessageBrokerHandlers();
            }
            
            this._initialized = true;
            
            // Emit ready event
            this.dispatchEvent(new CustomEvent('workerready', {
                detail: {
                    workerPool: !!this._workerPool,
                    sharedMemory: !!this._sharedMemory,
                    messageBroker: !!this._messageBroker
                }
            }));
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Setup message broker handlers
     */
    _setupMessageBrokerHandlers() {
        // Handle worker results
        this._messageBroker.subscribe('worker.result', (message) => {
            const operation = this._activeOperations.get(message.operationId);
            if (operation) {
                operation.resolve(message.result);
                this._completeOperation(message.operationId, true, message.duration);
            }
        });
        
        // Handle worker errors
        this._messageBroker.subscribe('worker.error', (message) => {
            const operation = this._activeOperations.get(message.operationId);
            if (operation) {
                operation.reject(new Error(message.error));
                this._completeOperation(message.operationId, false);
            }
        });
        
        // Handle worker progress
        this._messageBroker.subscribe('worker.progress', (message) => {
            this.dispatchEvent(new CustomEvent('workerprogress', {
                detail: {
                    operationId: message.operationId,
                    progress: message.progress
                }
            }));
        });
    }
    
    /**
     * Render operation using render worker
     */
    async render(params) {
        return this._executeWorkerTask('render', {
            operation: 'RENDER',
            params
        });
    }
    
    /**
     * Diff VDOM using render worker
     */
    async diffVDOM(oldVDOM, newVDOM, componentId) {
        return this._executeWorkerTask('render', {
            operation: 'DIFF_VDOM',
            params: { oldVDOM, newVDOM, componentId }
        });
    }
    
    /**
     * Batch render multiple components
     */
    async batchRender(components, parallel = true) {
        return this._executeWorkerTask('render', {
            operation: 'BATCH_RENDER',
            params: { components, parallel }
        });
    }
    
    /**
     * Compute heavy calculation
     */
    async compute(operation, params) {
        return this._executeWorkerTask('compute', {
            operation: 'COMPUTE',
            params: { operation, params }
        });
    }
    
    /**
     * Matrix multiplication
     */
    async matrixMultiply(matrixA, matrixB) {
        return this._executeWorkerTask('compute', {
            operation: 'MATRIX_MULTIPLY',
            params: { matrixA, matrixB }
        });
    }
    
    /**
     * Sort large array
     */
    async sortArray(array, algorithm = 'auto') {
        return this._executeWorkerTask('compute', {
            operation: 'SORT_LARGE_ARRAY',
            params: { array, algorithm }
        });
    }
    
    /**
     * Calculate primes
     */
    async calculatePrimes(limit) {
        return this._executeWorkerTask('compute', {
            operation: 'CALCULATE_PRIMES',
            params: { limit, returnList: false }
        });
    }
    
    /**
     * Process image
     */
    async processImage(imageData, operations) {
        return this._executeWorkerTask('compute', {
            operation: 'IMAGE_PROCESS',
            params: { imageData, operations }
        });
    }
    
    /**
     * Data operation
     */
    async data(operation, params) {
        return this._executeWorkerTask('data', {
            operation: 'DATA',
            params: { operation, params }
        });
    }
    
    /**
     * Store data
     */
    async setData(key, value, options = {}) {
        return this._executeWorkerTask('data', {
            operation: 'SET',
            params: { key, value, options }
        });
    }
    
    /**
     * Retrieve data
     */
    async getData(key, options = {}) {
        return this._executeWorkerTask('data', {
            operation: 'GET',
            params: { key, options }
        });
    }
    
    /**
     * Query data
     */
    async queryData(filter, options = {}) {
        return this._executeWorkerTask('data', {
            operation: 'QUERY',
            params: { filter, ...options }
        });
    }
    
    /**
     * Execute transaction
     */
    async transaction(operations, options = {}) {
        return this._executeWorkerTask('data', {
            operation: 'TRANSACTION',
            params: { operations, options }
        });
    }
    
    /**
     * Execute worker task
     */
    async _executeWorkerTask(workerType, task) {
        if (!this._initialized) {
            await this.initialize();
        }
        
        const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            // Store operation info
            this._activeOperations.set(operationId, {
                operationId,
                workerType,
                task,
                startTime,
                resolve,
                reject
            });
            
            // Update metrics
            this._metrics.operations++;
            this._metrics[`${workerType}Tasks`]++;
            
            // Use worker pool if available
            if (this._workerPool) {
                this._workerPool.execute(task, {
                    workerScript: this._config.workerScripts[workerType]
                }).then(result => {
                    this._completeOperation(operationId, true, performance.now() - startTime);
                    resolve(result);
                }).catch(error => {
                    this._completeOperation(operationId, false);
                    reject(error);
                });
            } else {
                // Fallback to direct execution
                reject(new Error('Worker pool not initialized'));
            }
        });
    }
    
    /**
     * Complete operation and update metrics
     */
    _completeOperation(operationId, success, duration) {
        const operation = this._activeOperations.get(operationId);
        if (!operation) return;
        
        this._activeOperations.delete(operationId);
        
        if (success && duration) {
            // Update average operation time
            const total = this._metrics.operations;
            this._metrics.avgOperationTime = 
                (this._metrics.avgOperationTime * (total - 1) + duration) / total;
        }
        
        // Update peak workers
        if (this._workerPool) {
            const stats = this._workerPool.getStats();
            this._metrics.peakWorkers = Math.max(
                this._metrics.peakWorkers,
                stats.workers.total
            );
        }
        
        // Emit completion event
        this.dispatchEvent(new CustomEvent('operationcomplete', {
            detail: {
                operationId,
                success,
                duration,
                workerType: operation.workerType
            }
        }));
    }
    
    /**
     * Allocate shared memory
     */
    allocateSharedMemory(size, alignment = 8) {
        if (!this._sharedMemory) {
            throw new Error('SharedMemory not initialized');
        }
        
        return this._sharedMemory.allocate(size, alignment);
    }
    
    /**
     * Free shared memory
     */
    freeSharedMemory(allocationId) {
        if (!this._sharedMemory) {
            throw new Error('SharedMemory not initialized');
        }
        
        this._sharedMemory.free(allocationId);
    }
    
    /**
     * Send message via broker
     */
    sendMessage(type, data, options = {}) {
        if (!this._messageBroker) {
            throw new Error('MessageBroker not initialized');
        }
        
        return this._messageBroker.send({
            type,
            data,
            source: this.tagName
        }, options);
    }
    
    /**
     * Subscribe to messages
     */
    subscribeToMessages(type, handler) {
        if (!this._messageBroker) {
            throw new Error('MessageBroker not initialized');
        }
        
        this._messageBroker.subscribe(type, handler);
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        const stats = {
            metrics: this._metrics,
            activeOperations: this._activeOperations.size
        };
        
        if (this._workerPool) {
            stats.workerPool = this._workerPool.getStats();
        }
        
        if (this._sharedMemory) {
            stats.sharedMemory = this._sharedMemory.getStats();
        }
        
        if (this._messageBroker) {
            stats.messageBroker = this._messageBroker.getStats();
        }
        
        return stats;
    }
    
    /**
     * Render component (override from base)
     */
    render() {
        return `
            <div class="worker-component">
                <div class="worker-status">
                    <h3>Worker System Status</h3>
                    <div class="metrics">
                        <div class="metric">
                            <span>Operations:</span>
                            <strong>${this._metrics.operations}</strong>
                        </div>
                        <div class="metric">
                            <span>Avg Time:</span>
                            <strong>${this._metrics.avgOperationTime.toFixed(2)}ms</strong>
                        </div>
                        <div class="metric">
                            <span>Active:</span>
                            <strong>${this._activeOperations.size}</strong>
                        </div>
                    </div>
                </div>
                <slot></slot>
            </div>
        `;
    }
    
    /**
     * Component styles
     */
    static get styles() {
        return `
            :host {
                display: block;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .worker-component {
                padding: 20px;
                background: #f5f5f5;
                border-radius: 8px;
            }
            
            .worker-status {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .worker-status h3 {
                margin: 0 0 15px 0;
                color: #333;
            }
            
            .metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }
            
            .metric {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 4px;
            }
            
            .metric span {
                color: #666;
            }
            
            .metric strong {
                color: #333;
            }
        `;
    }
    
    /**
     * Cleanup on disconnect
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Cancel active operations
        this._activeOperations.forEach(operation => {
            operation.reject(new Error('Component disconnected'));
        });
        this._activeOperations.clear();
        
        // Destroy systems
        if (this._workerPool) {
            this._workerPool.destroy();
            this._workerPool = null;
        }
        
        if (this._sharedMemory) {
            this._sharedMemory.destroy();
            this._sharedMemory = null;
        }
        
        if (this._messageBroker) {
            this._messageBroker.destroy();
            this._messageBroker = null;
        }
        
        this._initialized = false;
    }
}