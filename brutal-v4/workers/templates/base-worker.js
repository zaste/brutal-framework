/**
 * BRUTAL V4 - Base Worker Template
 * Template for creating BRUTAL workers
 */

import { WorkerMessage, MessageType, MessageHandlerMixin } from '../core/WorkerMessage.js';

/**
 * Base worker implementation
 */
class BrutalWorker {
    constructor() {
        // Setup message handling
        this.setupMessageHandling();
        
        // Register task handlers
        this.registerHandler(MessageType.EXECUTE, this.handleExecute.bind(this));
        
        // Setup message listener
        self.addEventListener('message', this.handleMessage.bind(this));
        
        // Send ready signal
        this.postMessage(WorkerMessage.status(MessageType.READY).serialize());
    }
    
    /**
     * Handle execute message
     */
    async handleExecute(data) {
        const { task, data: taskData } = data;
        
        // Route to specific task handler
        const handler = this[`task_${task}`];
        if (!handler) {
            throw new Error(`Unknown task: ${task}`);
        }
        
        return handler.call(this, taskData);
    }
    
    /**
     * Example task: heavy computation
     */
    task_compute(data) {
        const { iterations = 1000000 } = data;
        let result = 0;
        
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i);
        }
        
        return { result, iterations };
    }
    
    /**
     * Example task: data processing
     */
    task_process(data) {
        const { items = [] } = data;
        
        return items.map(item => ({
            ...item,
            processed: true,
            timestamp: Date.now()
        }));
    }
    
    /**
     * Example task: async operation
     */
    async task_fetch(data) {
        const { url } = data;
        
        const response = await fetch(url);
        const text = await response.text();
        
        return {
            status: response.status,
            length: text.length,
            headers: Object.fromEntries(response.headers.entries())
        };
    }
    
    /**
     * Post message helper
     */
    postMessage(message, transferables = []) {
        self.postMessage(message, transferables);
    }
    
    /**
     * Cleanup on termination
     */
    cleanup() {
        // Override in subclasses
    }
}

// Apply message handler mixin
Object.assign(BrutalWorker.prototype, MessageHandlerMixin);

// Create worker instance
new BrutalWorker();